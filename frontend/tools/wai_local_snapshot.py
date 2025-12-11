#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
WAI Local Snapshot Tool

역할:
- 기본 실행(인자 없음): 클립보드 워처 모드
  - 클립보드에서 `### [WAI:LOCAL_SNAPSHOT:설명]` 패턴을 감지하면
    → 현재 프로젝트 상태를 _snapshots/ 에 로컬 스냅샷으로 저장
    → 최근 3개만 유지, 나머지는 자동 삭제
