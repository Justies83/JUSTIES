---
title: "TSMC가 3D D램을 만든다고? 보도 하루 만에 '본업은 로직 파운드리'라며 선 그었다"
date: 2026-11-08
updated: 2026-11-27
category: tech
kind: news
takeaway: TSMC가 3D D램 검토 보도를 하루 만에 사실상 부인하며, 상용화까지 5년 넘게 남은 기술의 현실적 장벽을 드러냈다.
tags: [TSMC, 3D D램, 엔비디아, 디 인포메이션, 톰스하드웨어, 메모리 부족, HBM, 삼성전자, SK하이닉스]
cover: /images/tsmc-3d-dram-nvidia-denial-2026-11-08.jpg
coverAlt: "TSMC Fab 18(타이난) 외관"
source:
  name: "Tom's Hardware (2026.11.07)"
  url: https://www.tomshardware.com/pc-components/dram/tsmc-denies-exploring-3d-dram-at-nvidias-request-advanced-memory-tech-is-still-years-from-market-viability
---

11월 6일 금요일 오전, 디 인포메이션이 사안에 정통한 소식통 두 명을 인용해 TSMC가 최대 고객인 엔비디아의 요청으로 3D D램 생산을 검토하고 있다고 보도했고 로이터도 이를 전했다. 그날 뉴욕증시에서 TSMC ADR은 **6.33%** 올라 **375.44달러**로 마감했다. 하지만 하루 뒤인 토요일, TSMC는 톰스하드웨어에 "핵심 사업은 언제나 로직 파운드리"라는 입장을 내며 사실상 선을 그었다. 보도와 부인이 하루 간격으로 맞부딪힌 셈이다.

<p align="center"><img src="/images/tsmc-3d-dram-nvidia-denial-2026-11-08.jpg" alt="TSMC Fab 18(타이난) 외관" style="max-width:100%;height:auto;"/></p>

<p align="center" class="caption">사진: TSMC Fab 18(타이난) 외관 — TSMC 공식 보도자료 이미지(TSMC Multimedia Gallery).</p>

## 보도 내용과 시장의 즉각 반응

디 인포메이션 보도에 따르면 TSMC는 첨단 패키징을 총괄하고 과거 마이크론 대만 사업을 이끌었던 쉬궈친 부사장 주도로 3D D램 제조 계획 초안을 짜기 시작했다. 거론된 선택지는 전용 공장을 새로 짓거나 기존 팹을 사서 D램용으로 바꾸는 두 가지였고, 구체적인 생산 일정은 언급되지 않았다.

시장은 곧바로 반응했다. 목요일 종가 **353.10달러**(42.65달러 급락)였던 TSMC ADR은 금요일 380.56달러에 출발해 장중 367.95달러까지 밀렸다가 **375.44달러**로 거래를 마쳤다. 전날 낙폭의 절반 남짓을 되돌리며 거래량도 **2,380만 주** 안팎으로 불어났지만, 그날 뉴욕 증시 전반이 반등했던 점을 감안하면 상승분을 전적으로 보도 효과로만 돌리기는 어렵다.

<p align="center"><img src="/images/tsmc-3d-dram-stock-2026-11-08.svg" alt="TSMC ADR 종가 — 11월 5일 353.10달러, 11월 6일 375.44달러(+6.33%)" style="max-width:100%;height:auto;"/></p>

<p align="center" class="caption">도표는 Finnhub·TipRanks·StockAnalysis 2026년 11월 6일 뉴욕 정규장 종가 수치를 바탕으로 직접 만들었다.</p>

TSMC의 대응은 단계적으로 나왔다. 금요일에는 시장 루머에 코멘트하지 않는다고 말을 아꼈다가, 토요일 톰스하드웨어 보도에서는 대변인이 "핵심 사업은 로직 파운드리이며 앞으로도 글로벌 로직 IC 산업의 신뢰받는 기술·생산능력 제공자가 되는 것이 미션"이라고 못 박았다. 3D D램이나 엔비디아를 직접 거명하지는 않았지만 사실상의 부인으로 읽히는 대목이며, 엔비디아는 아직 공식 입장을 내지 않았다.

<p align="center"><img src="/images/tsmc-3d-dram-timeline-2026-11-08.svg" alt="TSMC 3D D램 논란 타임라인 — 11월 5일 급락, 11월 6일 보도와 반등, 11월 7일 부인, 11월 9일 대만 공매도 제한, 11월 10일 10월 매출 발표" style="max-width:100%;height:auto;"/></p>

<p align="center" class="caption">도표는 디 인포메이션·로이터·톰스하드웨어·TSMC 2026년 11월 5~7일 보도를 바탕으로 직접 만들었다.</p>

## 3D D램이 당장 해법이 못 되는 이유

기술적 맥락을 짚어보면 이런 소문이 왜 나왔고, 왜 실현이 까다로운지 동시에 보인다. 지금의 D램이 한 평면에 셀을 나란히 깔아 놓는 구조라면, 3D D램은 셀 자체를 수직으로 쌓아 웨이퍼당 용량을 늘리는 방식이다(HBM은 D램 다이를 쌓는다는 점에서 다르다). AI 서버 수요가 폭발하면서 메모리가 단순 부품이 아니라 출하량을 가르는 전략 자산이 됐기에 엔비디아 처지에서는 공급선을 더 뚫고 싶을 만하다.

하지만 마이크론·삼성전자·SK하이닉스 3사 모두 3D D램을 개발 중인데도 공개 로드맵상 상용화 시점은 **2030년 안팎**으로 잡혀 있다. 마이크론 로드맵만 봐도 그전에 평면 D램 공정이 최소 네 번 더 들어간다. 톰스하드웨어가 지적했듯 3D D램은 최소 5년 동안은 지금의 메모리 부족을 풀 수 없는 기술이다.

TSMC의 최근 실적(3분기 매출 467억 2,000만 달러로 전년 대비 41.2% 증가, 순이익 7,630억 6,000만 대만달러로 68.7% 증가, 4분기 매출 가이던스 523억\~543억 달러, 연간 성장률 전망 44% 안팎, 번스타인 목표가 554달러에서 600달러로 상향)이 탄탄하다고 해서 메모리 직접 진출이 쉬운 것도 아니다. TSMC는 경쟁력 있는 평면 D램 공정이 없어 중소 업체를 인수하더라도 수십억 달러와 수년의 연구개발이 추가로 들며, 팹을 새로 지으면 수백억 달러 단위로 비용이 뛴다. 게다가 차세대 HBM 로직 베이스 다이를 함께 만들기로 한 SK하이닉스와의 협력 관계, 독점 논란, 메모리 경기의 반복적인 공급 과잉 사이클까지 겹친다.

개인적으로는 TSMC가 굳이 D램을 직접 만들지 않고도 HBM 로직 베이스 다이 제작이나 SoIC 하이브리드 본딩, GUC 같은 파트너와의 맞춤형 메모리 솔루션으로 충분히 수익을 챙길 수 있는 위치에 있다고 본다. 굳이 수십억 달러짜리 위험을 안을 유인이 크지 않다는 뜻이다.

## 한국 증시 충격과 다음 확인 지점

이 소식은 한국 시장에도 즉각 파장을 남겼다. 금요일 코스피는 **6.02%** 급락한 **5,059.69**에 마감하며 장중 4,911.28까지 내려앉았고, 삼성전자는 **188,700원(-6.35%)**, SK하이닉스는 **113만 2,000원(-10.44%)으로** 밀렸다. 그 주 외국인들은 두 종목에서만 **7조 6,000억 원**을 순매도하며 외국인 지분율이 삼성전자 45.95%(2009년 이후 최저), SK하이닉스 48.27%(2021년 11월 이후 최저)까지 내려왔다. 장기 경쟁자 출현 우려가 주가를 눌렀지만, 역설적으로 당장의 메모리 부족은 국내 두 회사의 가격 결정력을 높여주는 요인이기도 하다.

결국 앞으로 확인할 숫자와 일정은 세 가지로 좁혀진다. 11월 9일부터 시행되는 대만 장중 공매도 제한(일평균 거래량 30%에서 3%로 축소), 11월 10일 발표되는 TSMC의 10월 매출이 4분기 가이던스 523억\~543억 달러 궤도에 맞는지 여부, 그리고 디 인포메이션과 TSMC 중 어느 쪽이 후속 카드나 추가 입장을 내놓는지다. 지금 단계에서는 보도된 검토와 회사의 부인을 나란히 놓고 숫자로 확인해 갈 수밖에 없다.

참고한 기사 — [The Information](https://www.theinformation.com/articles/tsmc-weighs-making-advanced-memory-chips-capture-ai-spending) · [Tom's Hardware](https://www.tomshardware.com/pc-components/dram/tsmc-denies-exploring-3d-dram-at-nvidias-request-advanced-memory-tech-is-still-years-from-market-viability) · [StockAnalysis](https://stockanalysis.com/stocks/tsm/history/) · [조선비즈](https://biz.chosun.com/en/en-finance/2026/11/08/P6SHWIXSKZHRJNFJBHNXIAVMRU/) · [ad-hoc-news](https://www.ad-hoc-news.de/boerse/unternehmensnachrichten/tsmc-s-next-test-a-short-selling-cap-in-taipei-and-an-october-sales-report-24-hours-later/70472628)
