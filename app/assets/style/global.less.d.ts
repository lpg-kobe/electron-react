declare namespace GlobalLessNamespace {
  export interface IGlobalLess {
    root: string;
  }
}

declare const GlobalLessModule: GlobalLessNamespace.IGlobalLess & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: GlobalLessNamespace.IGlobalLess;
};

export = GlobalLessModule;
