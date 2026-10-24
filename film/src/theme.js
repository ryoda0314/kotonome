// 色と字体。役割で色を固定する（子音＝青・母音＝赤・パッチム＝緑・足した線＝黄）。
// 動画を通して同じ色が同じ意味になるので、実践パートで色だけ見て部品が分かる。

export const W = 1920;
export const H = 1080;

export const C = {
  bg: '#FFFBF2',
  grid: '#F3E9D6',
  ink: '#1F2933',
  sub: '#5B6670',
  faint: '#D9CFBF',
  cons: '#2563EB',
  vowel: '#E5484D',
  final: '#16A34A',
  add: '#F59E0B',
  zunda: '#5DB85C',
  zundaDark: '#2F7D32',
  card: '#FFFFFF',
  skin: '#FDE3CF',
  skinLine: '#B9876B',
  cavity: '#7B2D3A',
  tongue: '#F08A97',
  tongueLine: '#B4475A',
};

export const ROLE_COLOR = { cho: C.cons, jung: C.vowel, jong: C.final };

export const FONT = {
  pop: '"HGPSoeiKakupoptai","HGSoeiKakupoptai","Noto Sans JP",sans-serif',
  sans: '"Noto Sans JP","Malgun Gothic",sans-serif',
  kr: '"Malgun Gothic","Noto Sans KR",sans-serif',
  serif: '"Noto Serif JP","Yu Mincho",serif',
};

// 舞台（ずんだもんと字幕を避けた範囲）
export const STAGE = { x0: 70, x1: 1500, y0: 130, y1: 860 };
