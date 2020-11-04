declare namespace GlobalLessNamespace {
  export interface IGlobalLess {
    clearfix: string;
    fl: string;
    fr: string;
    root: string;
  }
}

declare const GlobalLessModule: GlobalLessNamespace.IGlobalLess & {
  /** WARNING: Only available when `css-loader` is used without `style-loader` or `mini-css-extract-plugin` */
  locals: GlobalLessNamespace.IGlobalLess;
};

export = GlobalLessModule;
