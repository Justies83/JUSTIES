---
title: HBM을 옆이 아니라 위에 — 삼성이 내놓은 zHBM 콘셉트
date: 2026-08-25
category: tech
kind: news
takeaway: 삼성이 FMS 2026에서 GPU 위에 HBM을 수직으로 쌓는 zHBM 콘셉트를 공개했다. 아직 목업 단계이며, HBM5 대비 8배 성능·10배 밀도를 목표로 제시했다.
tags: [삼성전자, HBM, zHBM, 메모리, AI인프라]
cover: /images/zhbm-architecture-concept.svg
coverAlt: 기존 HBM은 GPU 옆에 나란히 배치되지만 zHBM 개념은 GPU 위에 수직으로 쌓는다는 비교 도식.
source:
  name: Samsung Semiconductor 공식 발표 (2026.08.04, FMS 2026)
  url: https://news.samsung.com/global/samsung-unveils-next-gen-3d-memory-vision-at-fms-2026-charting-the-future-of-ai-infrastructure
---

8월 초 미국 산타클라라에서 열린 FMS 2026(Flash Memory Summit)에서 삼성이
차세대 메모리 구조의 콘셉트를 공개했다. 요지는 하나다 — **HBM을 GPU 옆에
두지 말고, 위에 쌓자.**

## 사실

- 삼성은 8월 4일 FMS 2026에서 **zHBM**과 **zNAND-O**의 업계 첫 콘셉트 목업을
  공개했다.
- **zHBM**은 HBM을 AI 가속기(GPU) **바로 위에 수직으로 적층**하는 구조다.
  기존 구조는 HBM이 GPU 옆에 나란히 놓이고 기판 배선으로 연결된다. 삼성은
  이 구조가 **HBM5 대비 약 8배의 성능, 10배 이상의 메모리 밀도**를 낼 것으로
  제시했다.
- **zNAND-O**는 기존 V-NAND 기술을 기반으로 한 차세대 낸드로, 4단·8단 구성을
  개발 중이며 엣지 AI 환경을 겨냥한다고 밝혔다.
- 같은 자리에서 **V10 BV-NAND**(400단 이상, 새 본딩 구조)도 함께 공개했다.
- 발표는 개념 검증 단계이며, **양산 시점은 밝히지 않았다.**

## 해석

HBM을 GPU 옆에서 위로 옮기는 발상 자체는 새롭지 않다 — 데이터가 오가는
물리적 거리를 줄이면 속도가 오르고 전력 소모가 준다는 원리는 반도체 설계의
오래된 상식이다. 다만 지금까지는 열 방출과 공정 난이도 때문에 GPU 바로 위에
메모리를 쌓는 것이 상용화 단계까지 가지 못했다.

삼성이 이 콘셉트를 지금 꺼낸 시점도 봐야 한다. SK하이닉스가 HBM4 양산과
장기공급계약으로 실적을 끌어올리는 사이, 삼성은 "다음 세대의 구조 자체를
먼저 제시"하는 쪽을 택했다. 실제 제품 경쟁이 아니라 **로드맵 경쟁**에서
주도권을 가져오려는 발표로 읽힌다.

## 아직 확인되지 않은 것

- 열 방출 문제를 구체적으로 어떻게 해결했는지는 공개되지 않았다. GPU 바로
  위에 메모리를 쌓으면 그 열이 가장 뜨거운 지점에 그대로 얹히는 셈이라,
  이 문제의 해법이 이 구조의 실현 가능성을 좌우한다.
- 8배·10배라는 수치가 어떤 조건에서 측정(또는 추정)된 것인지 별도로
  공개되지 않았다.
- 양산 일정, 고객사 반응 모두 확인되지 않았다.

**출처**
- [Samsung Semiconductor 공식 발표(2026.08.04)](https://news.samsung.com/global/samsung-unveils-next-gen-3d-memory-vision-at-fms-2026-charting-the-future-of-ai-infrastructure)

*도표는 위 발표 내용을 바탕으로 단순화해 직접 작성했다.*
