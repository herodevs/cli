import { join } from 'path';
import { AggregateResult } from './models/aggregate-result';
import { ChartConfig } from './models/chart-config';
import { ProcessResult } from './models/process-result';
import { VizDataset } from './models/viz-dataset';
import { VizLabelsDatasets } from './models/viz-labels-datasets';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { format, parse } from 'date-fns';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import * as ChartDataLabels from 'chartjs-plugin-datalabels';
import * as autocolors from 'chartjs-plugin-autocolors';
import { ChartConfiguration } from 'chart.js';

export class TrackerChart {

  constructor(private _config: ChartConfig, private _allProcessResults: ProcessResult[], private _dateFormat: string) { }
  
  private getDataAndLabels(allJsonData, propName: string): VizLabelsDatasets {
    if (this._config.perCategoryTotals) {
      return this.getTotalsPerCategory(allJsonData, propName);
    }

    if (this._config.perCategoryAndFileType) {
      return this.getTotalsPerFileTypePerCategory(allJsonData, propName);
    }

    return this.getTotalsPerCategory(allJsonData, propName);
  }

  private getTotalsPerFileTypePerCategory(allJsonData, propName: string): VizLabelsDatasets {
    const runs = { };
    const allTypes = { };
    allJsonData.forEach((jsonData: ProcessResult, i) => {
      runs[jsonData.hash] = jsonData.timestamp;
      jsonData.categories.forEach((category) => {
        category.fileTypes.forEach((t) => {
          const label = `${category.name}: ${t.fileType}`;
          if (!allTypes[label]) {
            allTypes[label] = {
              label,
              data: []
            }
          }
          allTypes[label].data[i] = t[propName];
        });
      });
    });
  
    const labels = Object.values(runs) as string[];
    const datasets = Object.values(allTypes).map((t: VizDataset) => {
      return {
        ...t,
        fill: false,
        tension: .1
      }
    }) as VizDataset[];
  
    return {
      labels,
      datasets,
    };
  }
  
  private getTotalsPerCategory(allJsonData, propName: string): VizLabelsDatasets {
    const runs = { };
    const allTypes = { };
    allJsonData.forEach((jsonData: ProcessResult, i) => {
      runs[jsonData.hash] = jsonData.timestamp;
      jsonData.categories.forEach((category) => {
        const label = category.name;
        if (!allTypes[label]) {
          allTypes[label] = {
            label,
            data: []
          };
        }
  
        allTypes[label].data[i] = category.totals[propName];
      });
    });
  
    const labels = Object.values(runs) as string[];
    const datasets = Object.values(allTypes).map((t: VizDataset) => {
      return {
        ...t,
        fill: false,
        tension: .1
      }
    }) as VizDataset[];
  
    return {
      labels,
      datasets,
    };
  }

  private async generateGraphImageFile(parentDirectory: string, vizData: VizLabelsDatasets): Promise<void> {
    const outFile = join(parentDirectory, this._config.outFile);
  
    if (this._config.overwrite && existsSync(outFile)) { rmSync(outFile); }
  
    const dateFmt = this._dateFormat;
    const configuration = {
      type: 'line',
      data: vizData,
      options: {
        elements: {
          point:{
            radius: 0
          }
        },
        plugins: {
          title: {
            display: true,
            text: this._config.title
          },
          autocolors: {
            enabled: true,
            mode: 'data',
          },
          scales: {
            x: {
              type: 'timeseries',
              time: {
                minUnit: 'week',
              },
              parsing: false,
              title: {
                display: true,
                text: this._config.xAxisLabel
              },
              ticks: {
                source: 'data',
                callback: function(val) {
                  return format(
                    parse(this.getLabelForValue(val), dateFmt, new Date()),
                    'yyyy-MM-dd'
                  );
                }
              }
            },
            y: {
              title: {
                display: true,
                text: this._config.yAxisLabel
              }
            }
          }
        }
      },
    };
  
    try {
      const pieChart = new ChartJSNodeCanvas({
        width: this._config.width,
        height: this._config.height,
        backgroundColour: this._config.bg,
        plugins: {
          modern: [ChartDataLabels, autocolors],
        }
      });
  
      const result = await pieChart.renderToBuffer(configuration as ChartConfiguration);
  
      writeFileSync(outFile, result);
    } catch (exc) {
      console.error(exc);
    }
  }

  writeTo(parentDirectory: string, graphablePropertyName: keyof AggregateResult = 'total'): Promise<void> {
  
    const vizData = this.getDataAndLabels(this._allProcessResults, graphablePropertyName);
  
    return this.generateGraphImageFile(parentDirectory, vizData);
  }
}
