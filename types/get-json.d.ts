// declare module 'get-json' {
//   interface getJson {
//     default: (...args) => Promise<any>;
//   }
// }
declare function getJson(...args: any[]): Promise<any>;
declare namespace getJson {}
export = getJson;
