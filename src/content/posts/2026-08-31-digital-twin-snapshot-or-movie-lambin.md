---
title: 디지털 트윈은 스냅샷인가, 무비인가 — Lambin 키노트로 보는 의료 AI의 다음 단계
date: 2026-08-31
category: research
kind: note
takeaway: 멀티오믹스·공간전사체학·영상체학을 결합한 디지털 트윈은 한 시점의 정적 스냅샷이 아니라 개인의 궤적을 계속 갱신하는 모델이어야 하며, radiomics와 normative modeling을 결합하면 특수 검사 없이 일반 영상만으로도 구현 가능하다는 것이 Lambin 교수 발표의 핵심 제언이다.
tags: [디지털트윈, 멀티오믹스, radiomics, 공간전사체학, Philippe Lambin, 정밀의료, normative modeling, 고려대의대세미나, medomics]
source:
  name: 고려대 의과대학 Next Intelligence Seminar (2026.08.31)
  url: https://salab.korea.ac.kr/team
---

2026년 8월 31일 고려대학교 의과대학 Next Intelligence Seminar에서 Philippe
Lambin 교수(Maastricht University, Precision Medicine)가 "The Future of AI
in Medicine: From Foundation Models to Digital Twins"라는 제목으로 키노트를
진행했다. 결론 슬라이드의 핵심은, 영상 단독 접근보다 멀티모달/Medomics
접근이 우수하며, 멀티오믹스는 기전적 깊이는 크지만 공간적 커버리지가
제한적이라 종양 내 이질성이 큰 경우 공간전사체학이 필요하다는 것, 그리고
이런 멀티오믹스가 공간전사체학·영상체학(radiomics)·파운데이션 모델과
결합될 때 임상적으로 유의미한 디지털 트윈을 만들 잠재력이 크다는 것이다.

**디지털 트윈: 스냅샷인가 무비인가.** 전통적 시뮬레이션은 한 번 만들면
고정되는 정적 스냅샷인 반면, 디지털 트윈은 새 데이터가 들어올 때마다
계속 업데이트되는 모델이어야 한다는 것이 정의상의 핵심 차이다. Lambin
교수의 결론에서 "able to ingest sequential data"라는 표현이 바로 이
지점을 가리킨다. 다만 현실적으로는 웨어러블 데이터처럼 진짜 연속적인
데이터도 있지만, 영상·오믹스는 방문 시점마다 얻는 게 한계라 "완전한
무비"보다는 "촘촘한 스냅샷을 이어붙인 타임랩스"에 가깝다.

**조기 베이스라인의 가치.** 건강할 때 미리 개인의 정상 궤적을
확보해두면, 이후 이탈(deviation)을 인구 평균이 아니라 그 사람 고유의
과거와 비교해 조기에 잡아낼 수 있다. 이 개념은 "Life Course Digital
Twin(LifeTIME)" 제안이나 "출생부터 사망까지의 DT thread" 개념에서 이미
논의되고 있다. 다만 종양처럼 질병 특이적 트윈은 진단 이후에나 시작
가능하며, 그 이전 숙주 차원의 베이스라인(면역·유전체·이전 영상)이
이후 예측력을 높이는 역할을 한다.

**구현 방식: population 기반 기준값 vs 개인 스캔 분석.** 대규모 익명
코호트로 AI를 학습시켜 나이·성별 보정 정상 범위를 만드는 "normative
modeling"과, 특수 프로토콜 없는 일반 진료 영상에서 정량적 특징을
뽑아내는 "radiomics"(Lambin 교수 본인이 만든 개념)는 서로 다른 층위이지만
결합해서 쓰인다. Population 데이터가 AI의 기준(잣대)을 만들고, 개인의
일반 스캔이 그 기준에 대입되는 실제 측정값이 되는 구조다.

**결론의 성격.** 이날 발표된 결론 슬라이드들은 이미 배포된 특정 임상
시스템의 발표라기보다, radiomics·공간전사체학·멀티오믹스·파운데이션
모델 등 각각 검증이 진행 중인 연구 흐름들을 엮어 향후 방향을 제시하는
비전/제언 성격이 강하다. 다만 radiomics처럼 이미 검증된 요소들을
기반으로 하고 있어 완전히 추상적인 주장은 아니다. 발표는
"탈숙련화(deskilling)" 리스크와 "인지적 위임 vs 인지적 포기"의 구분,
그리고 연구뿐 아니라 임상 등급 AI 제품 개발·신속한 도입 지원의 필요성을
함께 강조하며 마무리됐다.

이어진 세션에서는 사경하 교수(의생명정보학교실)가 3D 공간 위상과 분자
복잡성을 결합한 교모세포종 진화 궤적 연구를, 서보경 교수(영상의학과)가
정량적 유방 영상 기반 정밀의료 연구를 발표했다.

## 참고 자료

- [Life Course Digital Twins (LifeTIME)](https://www.sciencedirect.com/org/science/article/pii/S1929074822003730)
- [Digital twins for health: a scoping review — npj Digital Medicine](https://www.nature.com/articles/s41746-024-01073-0)
- [Digital Twins and Traditional Simulation (static vs dynamic)](https://www.deepknit.ai/blog/comparing-digital-twins-traditional-simulation-in-healthcare/)
- [The promise of quantifying individual risk through normative modeling](https://www.sciencedirect.com/science/article/pii/S0149763425002854)
- [Radiomics in medical imaging — "how-to" guide](https://insightsimaging.springeropen.com/articles/10.1186/s13244-020-00887-2)
- [Sa Lab (Korea University)](https://salab.korea.ac.kr/team)
- [Prof. Dr. P. Lambin, Maastricht University](https://www.maastrichtuniversity.nl/p-lambin)
