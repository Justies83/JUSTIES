// Standalone tools published alongside the writing.
//
// Each tool is a self-contained HTML file living in `public/tools/`, served
// straight from the asset store — `run_worker_first` in wrangler.toml does not
// cover /tools, so nothing here sits behind the password gate. Astro never
// parses these files, so a tool built elsewhere works unchanged.
//
// `file` is the name inside public/tools. The tools page checks whether that
// file is actually present at build time and only links a tool that exists,
// so an entry can be written before the file is dropped in.

export type Tool = {
  /** Slug used for the anchor id on the tools page. */
  id: string;
  title: string;
  /** One line: what it does, for the card. */
  blurb: string;
  /** Filename inside public/tools/. */
  file: string;
  /** What a reader needs before the tool is useful to them. */
  audience: string;
  /** Longer explanation shown under the title. */
  detail: string[];
  /** The post that explains the background, if one is written. */
  post?: string;
  updated: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'tkov3-oligo-designer',
    title: 'TKOv3 → PX459 올리고 설계기',
    blurb:
      'TKOv3 녹아웃 라이브러리에서 유전자별 sgRNA를 찾아 PX459 클로닝용 올리고 한 쌍으로 바꿔 줍니다.',
    file: 'tkov3-oligo-designer.html',
    audience: 'CRISPR 녹아웃 실험을 직접 설계하는 분',
    detail: [
      '유전자 이름을 넣으면 TKOv3 라이브러리에 등재된 가이드를 불러오고, 그것을 벡터에 넣을 수 있는 형태의 올리고 서열로 변환합니다.',
      '브라우저 안에서만 계산합니다. 입력한 유전자 이름이나 서열이 서버로 전송되지 않습니다.',
    ],
    post: '/posts/2026-08-31-tkov3-px459-oligo-designer',
    updated: '2026-08-31',
  },
];
