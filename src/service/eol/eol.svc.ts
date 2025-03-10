import { log } from '../../hooks/prerun/CommandContextHook';
import { ScanResult } from '../nes/modules/sbom';
import { NesApolloClient } from '../nes/nes.client';

interface Sbom { components: SbomEntry[], dependencies: SbomEntry[] }
interface SbomEntry { evidence?: SbomEvidence; group: string, name: string, purl: string, version: string, }
interface SbomEvidence { occurrences?: Array<{ location: string }> }
interface SbomMap { components: Record<string, SbomEntry>, purls: string[] }


/**
 * Main function to scan directory and collect SBOM data
 */
export async function scanForEol(directory = process.cwd()) {
  const sbom = await createBomFromDir(directory)
  const map = await extractComponents(sbom)


  // NOTE: GRAPHQL_HOST is set in `./bin/dev.js`
  const host = process.env.GRAPHQL_HOST || 'https://api.nes.herodevs.com'
  const path = process.env.GRAPHQL_PATH || '/graphql'
  const url = host + path
  const client = new NesApolloClient(url)
  const scan = await client.scan.sbom(map)
  return { map, sbom, scan }
}




function daysBetween(date1: Date, date2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24 + 15; // milliseconds in a day plus 15 ms
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}


export async function extractComponents(sbom: Sbom): Promise<SbomMap> {
  const { components: comps, dependencies } = sbom;
  const components = [...comps, ...dependencies]
    .reduce((acc, entry) => {
      if (entry.purl) {
        acc[entry.purl] = entry;
      }

      return acc;
    }, {} as Record<string, SbomEntry>);

  return { components, purls: Object.keys(components).sort() };
}


const SHOW_OCCURRENCES = (process.env.SHOW_OCCURRENCES || 'false') === 'true';
const SHOW_OK = (process.env.SHOW_OK || 'false') === 'true';

export async function prepareLines({ components, purls }: SbomMap, scan: ScanResult) {

  let lines = purls.map(purl => {
    const { evidence, group, name, version } = components[purl];
    const occ = evidence?.occurrences?.map(o => o.location).join('\n\t - ');
    const occurrances = SHOW_OCCURRENCES && Boolean(occ) ? '\t - ' + occ + '\n' : ''


    const details = scan?.components[purl]
    if (details) {
      // log.info('whats details', details)
    }

    // TODO: pull this from API/response
    const info = details?.info || { eolAt: new Date(), isEol: false }

    info.eolAt = (typeof info.eolAt === 'string') ? new Date(info.eolAt) : info.eolAt

    const daysEol = info.eolAt ? daysBetween(new Date(), info.eolAt) : undefined
    let status = 'OK'

    if (daysEol === undefined) {
      status = info.isEol ? 'EOL' : status
    } else if (daysEol < 0) {
      status = 'EOL'
    } else if (daysEol > 0) {
      status = 'LTS'
    }



    // get the status

    return {
      daysEol,
      evidence: occurrances,
      info,
      purl,
      status
    }
  })

  if (!SHOW_OK) {
    lines = lines.filter(l => l.status !== 'OK')
  }

  // console.log(lines.map(l => l.line).join(''))

  // const table = new Table({
  //   head: ['Status', 'PURL /\nDetails'],
  //   // colWidths: [10, 90]
  // })

  // lines.forEach(({ status, purl, info, daysEol }) => {
  //   let msg = ''
  //   let stat

  //   switch (status) {
  //     case 'OK':
  //       stat = chalk.green('OK')
  //       break
  //     case 'LTS':
  //       stat = chalk.yellow('LTS')
  //       msg = `Will go EOL in ${chalk.yellow(Math.abs(daysEol!))} days.\n`
  //         + `EOL Date: ${chalk.yellow(info.eolAt.toDateString())} `
  //       break
  //     case 'EOL':
  //       stat = chalk.red('EOL')
  //       msg = `EOL'd ${chalk.bgRed(Math.abs(daysEol!))} days ago.\n`
  //         + `EOL Date: ${chalk.bgYellow(info.eolAt.toDateString())} `
  //       break
  //   }

  //   table.push(
  //     [
  //       { content: stat, rowSpan: 2 },
  //       { content: chalk.blue(purl) }
  //     ],
  //     [msg]
  //   )
  // })

  // console.log(table.toString())
  return lines
}

export async function createBomFromDir(directory: string) {

  const options = {
    '$0': 'cdxgen',
    _: [],
    'auto-compositions': true,
    autoCompositions: true,
    'data-flow-slices-file': 'data-flow.slices.json',
    dataFlowSlicesFile: 'data-flow.slices.json',
    deep: false,
    'deps-slices-file': 'deps.slices.json',
    depsSlicesFile: 'deps.slices.json',
    evidence: false,
    'export-proto': false,
    exportProto: false,
    'fail-on-error': true,
    failOnError: true,
    'include-crypto': false,
    'include-formulation': false,
    includeCrypto: false,
    includeFormulation: false,
    // 'server-host': '127.0.0.1',
    // serverHost: '127.0.0.1',
    // 'server-port': '9090',
    // serverPort: '9090',
    'install-deps': true,
    installDeps: true,
    'min-confidence': 0,
    minConfidence: 0,
    multiProject: true,
    'no-banner': false,
    noBabel: false,
    noBanner: false,
    o: 'bom.json',
    output: 'bom.json',
    outputFormat: "json", // or "xml"
    // author: ['OWASP Foundation'],
    profile: 'generic',
    project: undefined,
    'project-version': '',
    // projectName: 'cli',
    projectType: undefined,
    projectVersion: '',
    'proto-bin-file': 'bom.cdx',
    protoBinFile: 'bom.cdx',
    r: true,
    'reachables-slices-file': 'reachables.slices.json',
    reachablesSlicesFile: 'reachables.slices.json',
    recurse: true,
    'semantics-slices-file': 'semantics.slices.json',
    semanticsSlicesFile: 'semantics.slices.json',
    'skip-dt-tls-check': false,
    skipDtTlsCheck: false,
    'spec-version': 1.6,
    specVersion: 1.6,
    'usages-slices-file': 'usages.slices.json',
    usagesSlicesFile: 'usages.slices.json',
    validate: true
  }

  const { createBom } = await getCdxGen()
  const sbom = await createBom(directory, options);
  return sbom.bomJson
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cdxgen: any | undefined
async function getCdxGen() {
  if (cdxgen) {
    return cdxgen
  }

  const ogEnv = process.env.NODE_ENV
  delete process.env.NODE_ENV
  try {
    cdxgen = await import('@cyclonedx/cdxgen')
  } finally {
    process.env.NODE_ENV = ogEnv
  }

  return cdxgen!
}

