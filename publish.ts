import {concatMapFn, copy, mapFn} from "@softwareventures/array";
import {chain} from "@softwareventures/chain";
import {notNull} from "@softwareventures/nullable";
import {Credentials, S3} from "aws-sdk";
import * as fs from "fs";
import globby = require("globby");
import {getType} from "mime";
import * as path from "path";
import {Context} from "semantic-release";
import {Config} from "./index";
import parallel from "./parallel";
import {verified} from "./verify-conditions";

export default async function publish(config: Config, context: Context): Promise<void> {
    if (!verified) {
        throw new Error("verifyConditions was not called. semantic-release-s3-upload " +
            "needs to be included in the verifyConditions step");
    }

    const {logger} = context;

    const accessKeyId = notNull(context.env["AWS_ACCESS_KEY_ID"]);
    const secretAccessKey = notNull(context.env["AWS_SECRET_ACCESS_KEY"]);

    const s3 = new S3({
        apiVersion: "2006-03-01",
        credentials: new Credentials(accessKeyId, secretAccessKey),
        sslEnabled: true,
        computeChecksums: true
    });

    return chain(config.uploads)
        .map(mapFn(({src, dest}) => ({
            src: {
                dir: src.dir,
                files: globby(src.include || "**", {
                    cwd: src.dir,
                    ignore: copy(src.exclude || []),
                    onlyFiles: true
                })
            },
            dest
        })))
        .map(mapFn(async ({src, dest}) => src.files
            .then(mapFn(file => ({
                file: path.resolve(src.dir, file),
                dest: {
                    bucket: dest.bucket,
                    key: dest.prefix
                        ? dest.prefix + "/" + file
                        : file,
                    contentType: getType(file)
                }
            })))))
        .map(async files => Promise.all(files))
        .map(async files => files.then(concatMapFn(file => file)))
        .map(async files => files
            .then(mapFn(({file, dest}) => async () => {
                logger.log(`Uploading ${file} to ${dest.bucket}:${dest.key}`);
                return new Promise<S3.PutObjectOutput>((resolve, reject) =>
                    s3.putObject({
                        Bucket: dest.bucket,
                        Key: dest.key,
                        Body: fs.createReadStream(file),
                        ...(dest.contentType == null ? null : {ContentType: dest.contentType})
                    }, (err, data) => err ? reject(err) : resolve(data)));
            })))
        .map(async actions => actions.then(parallel))
        .map(async result => result.then((_: ReadonlyArray<S3.PutObjectOutput>) => void 0))
        .value;
}
