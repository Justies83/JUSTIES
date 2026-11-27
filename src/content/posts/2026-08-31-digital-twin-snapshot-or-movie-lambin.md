---
title: 디지털 트윈은 스냅샷인가, 무비인가 — Lambin 키노트로 보는 의료 AI의 다음 단계
date: 2026-08-31
updated: 2026-11-27
category: research
kind: note
takeaway: 의료 디지털 트윈은 정적 시뮬레이션이 아니라 순차 데이터로 계속 갱신되는 궤적 모델이어야 한다는 람빈 교수의 키노트를 정리했다.
tags: [디지털트윈, 멀티오믹스, radiomics, 공간전사체학, Philippe Lambin, 정밀의료, normative modeling, 고려대의대세미나, medomics]
source:
  name: 고려대 의과대학 Next Intelligence Seminar (2026.08.31)
  url: https://salab.korea.ac.kr/team
---

요즘 의생명 연구 발표나 논문에서 '디지털 트윈'이라는 단어를 자주 마주치지만, 막상 들여다보면 기존 시뮬레이션이나 예측 모델에 이름만 바꿔 붙인 경우가 적지 않다. 그래서 8월 31일 고려대학교 의과대학 Next Intelligence Seminar에서 네덜란드 마스트리흐트 대학의 Philippe Lambin 교수가 "The Future of AI in Medicine: From Foundation Models to Digital Twins"를 주제로 키노트를 진행했을 때, `radiomics` 개념을 처음 정립한 연구자가 의료 디지털 트윈의 기술적 조건을 어떻게 정의하는지가 특히 궁금했다.

## 영상 단독을 넘어 멀티모달과 공간전사체학으로

발표의 결론 슬라이드가 짚은 출발점은 명확하다. 영상 데이터만 단독으로 분석하는 방식보다 멀티모달, 이른바 Medomics 접근이 더 나은 성능을 보인다는 점이다.

생물학 데이터를 다루는 입장에서 인상 깊었던 대목은 멀티오믹스의 한계를 짚은 부분이었다. 멀티오믹스 데이터는 분자 기전을 깊이 파고드는 데는 강점이 있지만 조직 내 공간적 커버리지가 제한적이다. 특히 종양 내 이질성(intratumoral heterogeneity)이 큰 암종에서는 벌크(bulk) 오믹스만으로는 국소적인 미세환경 차이를 읽어내기 어렵기 때문에 공간전사체학(spatial transcriptomics)의 결합이 필수로 따라붙는다. 여기에 비침습적 영상에서 정량 특징을 뽑아내는 영상체학(radiomics)과 대규모 파운데이션 모델이 엮여야 비로소 임상에서 쓸 만한 디지털 트윈의 잠재력이 열린다는 구상이다.

## 스냅샷이 아니라 타임랩스에 가까운 무비

이날 키노트에서 가장 핵심적인 개념 구분은 '스냅샷(snapshot)인가 무비(movie)인가'라는 질문이었다. 전통적인 생체 시뮬레이션은 특정 시점의 파라미터를 넣고 한 번 구축하면 그대로 고정되는 정적 스냅샷에 가깝다. 반면 디지털 트윈이 제 이름을 값하려면 새 데이터가 유입될 때마다 모델 상태가 계속 갱신돼야 한다. 람빈 교수가 결론에서 강조한 "able to ingest sequential data"라는 조건이 바로 이 지점을 가리킨다.

다만 현실의 임상 데이터를 떠올려 보면 이 지점이 말처럼 매끄럽지만은 않다. 웨어러블 기기처럼 심박이나 활동량을 연속으로 기록하는 신호도 있지만, 정밀 영상이나 오믹스 검사는 환자가 병원을 방문하는 시점에만 띄엄띄엄 얻을 수 있기 때문이다. 결국 현재 임상 환경에서 구현 가능한 디지털 트윈은 끊김 없이 흐르는 완전한 '무비'라기보다, 시간 간격을 두고 찍은 촘촘한 스냅샷을 이어 붙여 변화를 추적하는 '타임랩스(time-lapse)'에 가깝다는 현실적 한계도 함께 짚고 넘어가야 한다.

## 건강할 때의 베이스라인과 두 층위의 기준값

데이터가 순차적으로 쌓여야 한다면 자연스럽게 조기 베이스라인(baseline)의 중요성으로 이어진다. 사람이 아직 건강할 때 정상 궤적을 미리 확보해 두면, 이후 생체 지표에서 이탈(deviation)이 생겼을 때 인구 집단 평균이 아니라 그 사람 고유의 과거 상태와 비교해 이상 징후를 일찍 포착할 수 있다. 이러한 관점은 'Life Course Digital Twin(LifeTIME)' 제안이나 출생부터 사망까지 이어지는 'DT thread' 같은 장기 추적 모델에서 이미 활발히 논의되고 있는 흐름이다.

물론 종양처럼 특정 시점에 발병하는 질병 특이적 트윈은 진단이 내려진 이후에야 본격적으로 구성할 수 있다. 하지만 그 이전 단계에 쌓아 둔 숙주 차원의 베이스라인—면역 상태, 유전체 배경, 이전의 정상 영상 기록—이 남아 있다면 진단 이후 병의 진행과 치료 반응을 예측하는 정밀도를 한층 끌어올리는 발판이 된다.

이 구상을 실제 병원에 들이기 위한 방법론으로 제시된 조합도 흥미롭다. 하나는 대규모 익명 코호트로 AI를 학습시켜 연령과 성별을 보정한 정상 분포의 잣대를 세우는 'normative modeling'이고, 다른 하나는 특수 촬영 프로토콜 없이 일상적인 진료 영상에서 정량적 특징을 추출하는 'radiomics'다. 두 기법은 작동하는 층위가 다르다. 대규모 인구집단 데이터가 비교 기준(잣대)을 세워주면, 개인의 일반 스캔에서 뽑아낸 정량 값이 그 잣대 위 어디에 위치하는지를 가늠하는 실제 측정치로 들어가는 구조다. 고가의 특수 검사를 매번 추가하지 않고도 기존 임상 워크플로 안에서 개인화 추적을 시도해 볼 수 있다는 점에서 실용적인 타협점으로 보였다.

## 비전으로서의 무게와 함께 남긴 경고

전체적으로 이날 제시된 결론 슬라이드는 이미 현장에 배포돼 검증을 마친 특정 소프트웨어의 결과 보고라기보다, radiomics·공간전사체학·멀티오믹스·파운데이션 모델처럼 각 영역에서 검증이 진행 중인 연구 흐름들을 하나의 아키텍처로 엮어 보인 비전과 로드맵 성격이 강했다. 그럼에도 radiomics처럼 수년간 임상 검증이 누적된 도구를 토대로 삼고 있기에 공허한 청사진으로만 들리지는 않았다.

발표 말미에 람빈 교수가 덧붙인 경고도 연구자와 임상의 모두 새겨둘 만하다. 의료 AI가 정교해질수록 인간 의사의 판단 능력이 무뎌지는 '탈숙련화(deskilling)' 위험을 경계해야 하며, 보조 도구에 일부 연산을 맡기는 '인지적 위임(cognitive delegation)'과 판단 자체를 넘겨버리는 '인지적 포기(cognitive abdication)'를 분명히 구분해야 한다는 지적이었다. 아울러 학술 논문 수준에 머물지 않고 임상 등급 AI 제품으로 개발해 현장에 신속히 도입할 수 있도록 뒷받침하는 체계가 필요하다는 말로 키노트를 마쳤다.

이어진 세션에서는 고려대 의생명정보학교실 사경하 교수가 3D 공간 위상과 분자 복잡성을 결합해 교모세포종의 진화 궤적을 추적한 연구를, 영상의학과 서보경 교수가 정량적 유방 영상 기반의 정밀의료 연구를 각각 발표했다. 기전과 공간, 그리고 영상 정량화라는 세 축이 같은 오후 한 자리에서 맞물려 돌아간 셈이다. 다음번에 관련 문헌을 더 찾아볼 때는, 람빈 교수가 언급한 normative modeling과 순차적 radiomics 결합이 실제 종단 코호트에서 어느 정도 예측력 개선으로 입증됐는지 원논문 수치를 직접 확인해 볼 생각이다.

## 참고 자료

- [Life Course Digital Twins (LifeTIME)](https://www.sciencedirect.com/org/science/article/pii/S1929074822003730)
- [Digital twins for health: a scoping review — npj Digital Medicine](https://www.nature.com/articles/s41746-024-01073-0)
- [Digital Twins and Traditional Simulation (static vs dynamic)](https://www.deepknit.ai/blog/comparing-digital-twins-traditional-simulation-in-healthcare/)
- [The promise of quantifying individual risk through normative modeling](https://www.sciencedirect.com/science/article/pii/S0149763425002854)
- [Radiomics in medical imaging — "how-to" guide](https://insightsimaging.springeropen.com/articles/10.1186/s13244-020-00887-2)
- [Sa Lab (Korea University)](https://salab.korea.ac.kr/team)
- [Prof. Dr. P. Lambin, Maastricht University](https://www.maastrichtuniversity.nl/p-lambin)
