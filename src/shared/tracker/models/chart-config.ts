export class ChartConfig {
  private _perCategoryAndFileType = false;
  private _perCategoryTotals = true;
  private _width = 1200;
  private _height = 800;   
  private _bg = 'white';
  private _title = 'Migration Progress LOC';
  private _xAxisLabel = 'Date';
  private _yAxisLabel = 'Totals';
  private _overwrite = true;
  private _outFile = 'viz.png';

  get perCategoryAndFileType(): boolean {
    // if false, use false; false !== undefined
    return this._cliOptions.perCategoryAndFileType !== undefined ? 
      this._cliOptions.perCategoryAndFileType :
      this._perCategoryAndFileType;
  }

  get perCategoryTotals(): boolean {
    // if false, use false; false !== undefined
    return this._cliOptions.perCategoryTotals !== undefined ?
      this._cliOptions.perCategoryTotals:
      this._perCategoryTotals;
  }

  get width(): number {
    // if set and non-numeric
    if (this._cliOptions.width !== undefined && isNaN(Number(this._cliOptions.width))) {
      throw Error('--chart.width must be a number');
    }
    // if unset or numeric
    return this._cliOptions.width !== undefined ?
      this._cliOptions.width:
      this._width;
  }

  get height(): number {
    // if set and non-numeric
    if (this._cliOptions.height !== undefined && isNaN(Number(this._cliOptions.height))) {
      throw Error('--chart.height must be a number');
    }
    // if unset or numeric
    return this._cliOptions.height !== undefined ?
      this._cliOptions.height:
      this._height;
  }

  get bg(): string {
    return this._cliOptions.bg ? 
      this._cliOptions.bg:
      this._bg;
  }

  get title(): string {
    return this._cliOptions.title ?
      this._cliOptions.title:
      this._title;
  }

  get xAxisLabel(): string {
    return this._cliOptions.xAxisLabel ?
      this._cliOptions.xAxisLabel:
      this._xAxisLabel;
  }

  get yAxisLabel(): string {
    return this._cliOptions.yAxisLabel ?
      this._cliOptions.yAxisLabel:
      this._yAxisLabel;
  }

  get overwrite(): boolean {
    return this._cliOptions.overwrite !== undefined ?
      this._cliOptions.overwrite:
      this._overwrite;
  }

  get outFile(): string {
    return this._cliOptions.outFile ?
      this._cliOptions.outFile:
      this._outFile;
  }

  constructor(private _cliOptions: ChartConfig = {} as ChartConfig) { }
}
