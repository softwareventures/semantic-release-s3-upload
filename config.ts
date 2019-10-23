export interface Config {
    readonly uploads: ReadonlyArray<Upload>;
}

export interface Upload {
    readonly src: {
        readonly dir: string;
        readonly include?: ReadonlyArray<string>;
        readonly exclude?: ReadonlyArray<string>;
    };
    readonly dest: {
        readonly bucket: string;
        readonly prefix?: string;
    };
}
