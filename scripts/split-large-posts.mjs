#!/usr/bin/env node
/**
 * split-large-posts.mjs — Split oversized posts with inlined sub-pages into separate posts.
 *
 * Strategy:
 * - CKA 스터디 (8400 lines): Split by major topic sections
 * - 알고리즘/코딩테스트 (4029 lines): Split by algorithm category
 * - LFCS (2797 lines): Split by exam section (Essential Commands, Operations, etc.)
 * - 이력서 기술 딥다이브 (321 lines): Keep as-is (borderline size)
 *
 * Each split creates a new post with:
 * - Inherited tags + parent title reference
 * - Same date as parent
 * - Proper frontmatter
 */

import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

const POSTS_DIR = './src/content/posts';

async function splitPost(filename, splitConfig) {
  const filePath = path.join(POSTS_DIR, filename);
  const content = await readFile(filePath, 'utf-8');

  // Parse frontmatter
  const fmEnd = content.indexOf('\n---\n', 4) + 5;
  const frontmatter = content.slice(0, fmEnd);
  const body = content.slice(fmEnd);

  // Extract frontmatter fields
  const dateMatch = frontmatter.match(/^date:\s*(.+)$/m);
  const tagsMatch = frontmatter.match(/^tags:\s*\[(.+)\]$/m);
  const date = dateMatch ? dateMatch[1].trim() : '2025-01-01';
  const tags = tagsMatch ? tagsMatch[1].trim() : '';

  // Split by H2 sections
  const sections = [];
  const lines = body.split('\n');
  let currentSection = { title: '_intro', lines: [] };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection.lines.length > 0 || currentSection.title !== '_intro') {
        sections.push(currentSection);
      }
      currentSection = { title: line.replace(/^## /, '').replace(/\*\*/g, '').trim(), lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }
  sections.push(currentSection);

  // Group sections according to config
  const outputs = [];
  const usedSections = new Set();

  for (const group of splitConfig.groups) {
    const matchedSections = [];
    for (let i = 0; i < sections.length; i++) {
      const title = sections[i].title.toLowerCase();
      const matches = group.match.some(pattern => {
        if (pattern.startsWith('/') && pattern.endsWith('/')) {
          return new RegExp(pattern.slice(1, -1), 'i').test(sections[i].title);
        }
        return title.includes(pattern.toLowerCase());
      });
      if (matches && !usedSections.has(i)) {
        matchedSections.push(sections[i]);
        usedSections.add(i);
      }
    }

    if (matchedSections.length === 0) continue;

    const bodyContent = matchedSections
      .map(s => {
        const sectionBody = s.lines.join('\n').trim();
        return `## ${s.title}\n\n${sectionBody}`;
      })
      .join('\n\n');

    if (bodyContent.trim().length < 50) continue; // skip near-empty groups

    const groupTags = group.extraTags ? `${tags}, ${group.extraTags}` : tags;
    const desc = group.description || `${splitConfig.seriesName} — ${group.title}`;

    outputs.push({
      filename: sanitize(group.title) + '.md',
      content: `---
title: "${group.title}"
description: "${desc.replace(/"/g, '\\"')}"
date: ${date}
tags: [${groupTags}]
category: uncategorized
lang: ko
draft: false
---

${bodyContent.trim()}
`,
    });
  }

  // Remaining sections → keep in original (trimmed)
  const remainingSections = sections.filter((_, i) => !usedSections.has(i));
  if (remainingSections.length > 0) {
    const remainBody = remainingSections
      .map(s => {
        if (s.title === '_intro') return s.lines.join('\n').trim();
        return `## ${s.title}\n\n${s.lines.join('\n').trim()}`;
      })
      .join('\n\n');

    // Rewrite original with just the remaining
    const newContent = frontmatter + '\n' + remainBody.trim() + '\n';
    await writeFile(filePath, newContent, 'utf-8');
    console.log(`  ✏️  Trimmed original: ${filename} (${remainingSections.length} sections kept)`);
  } else {
    // All sections extracted — mark original as draft
    const draftContent = frontmatter.replace('draft: false', 'draft: true');
    await writeFile(filePath, draftContent, 'utf-8');
    console.log(`  📦 Original marked as draft: ${filename}`);
  }

  // Write split files
  for (const out of outputs) {
    const outPath = path.join(POSTS_DIR, out.filename);
    await writeFile(outPath, out.content, 'utf-8');
    const lineCount = out.content.split('\n').length;
    console.log(`  ✅ Created: ${out.filename} (${lineCount} lines)`);
  }

  return outputs.length;
}

function sanitize(title) {
  return title
    .replace(/[^\p{L}\p{N}\s\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  let total = 0;

  // === CKA 스터디 ===
  console.log('\n=== Splitting CKA 스터디 ===');
  total += await splitPost('CKA 스터디.md', {
    seriesName: 'CKA',
    groups: [
      {
        title: 'CKA - Pod Scheduling과 리소스 관리',
        match: ['scheduling', 'taint', 'affinity', 'priorityclass', 'static pod', 'daemonset', 'resource', 'limit'],
        extraTags: 'scheduling',
        description: 'Kubernetes 스케줄링, Taint/Toleration, Affinity, PriorityClass, Static Pod',
      },
      {
        title: 'CKA - Storage (PV, PVC, StorageClass)',
        match: ['pv', 'pvc', 'storage', 'persistent'],
        extraTags: 'storage',
        description: 'Kubernetes Persistent Volume, PVC, StorageClass 개념과 실습',
      },
      {
        title: 'CKA - Networking (Service, Ingress, CNI)',
        match: ['service', 'ingress', 'cni', 'network', 'dns', 'coredns', 'gateway', 'calico'],
        extraTags: 'networking',
        description: 'Kubernetes 네트워킹: Service, Ingress, CNI, CoreDNS, Gateway API',
      },
      {
        title: 'CKA - Security (RBAC, TLS, ServiceAccount)',
        match: ['security', 'rbac', 'tls', 'serviceaccount', 'cert', 'kubeconfig', 'authentication', 'api group', 'authorization'],
        extraTags: 'security',
        description: 'Kubernetes 보안: RBAC, TLS 인증서, ServiceAccount, API Groups',
      },
      {
        title: 'CKA - Workload 관리 (Deployment, ConfigMap, Secret)',
        match: ['rollout', 'configmap', 'secret', 'env', 'command', 'args', 'deployment', 'logging', 'monitoring', 'multi container', 'init container', 'sidecar'],
        extraTags: 'workload',
        description: 'Kubernetes 워크로드: Deployment, ConfigMap, Secret, 멀티컨테이너 패턴',
      },
      {
        title: 'CKA - 클러스터 운영 (Upgrade, Backup, ETCD)',
        match: ['upgrade', 'backup', 'restore', 'etcd', 'os upgrade', 'drain', 'cordon', 'maintenance'],
        extraTags: 'operations',
        description: 'Kubernetes 클러스터 운영: 업그레이드, ETCD 백업/복구, 노드 관리',
      },
      {
        title: 'CKA - 패키지 매니저 (Helm, Kustomize)',
        match: ['helm', 'kustomize'],
        extraTags: 'helm',
        description: 'Kubernetes 패키지 관리: Helm, Kustomize 사용법과 실습',
      },
      {
        title: 'CKA - CRD와 확장 (CRD, CRI, Operator)',
        match: ['crd', 'cri', 'operator', 'custom resource'],
        extraTags: 'extensibility',
        description: 'Kubernetes 확장: CRD, CRI, Operator 패턴',
      },
      {
        title: 'CKA - 기출 풀이 및 시험 팁',
        match: ['기출', 'dotfile', '연습', '참고자료', '/^CKA /'],
        description: 'CKA 시험 기출 풀이, 팁, 참고자료 모음',
      },
    ],
  });

  // === 알고리즘/코딩테스트 ===
  console.log('\n=== Splitting 알고리즘/코딩테스트 ===');
  total += await splitPost('알고리즘코딩테스트.md', {
    seriesName: '알고리즘',
    groups: [
      {
        title: '알고리즘 - DFS BFS 그래프 탐색',
        match: ['dfs', 'bfs', '그래프'],
        extraTags: 'algorithm',
        description: 'DFS/BFS 그래프 탐색 알고리즘 정리 및 풀이',
      },
      {
        title: '알고리즘 - DP 동적 프로그래밍',
        match: ['dp', '동적'],
        extraTags: 'algorithm',
        description: '동적 프로그래밍(DP) 패턴 정리 및 풀이',
      },
      {
        title: '알고리즘 - 해시 구현 정렬',
        match: ['해시', '구현', '정렬', 'stack', 'queue', 'math'],
        extraTags: 'algorithm',
        description: '해시, 구현, 정렬, 스택/큐, 수학 알고리즘 정리',
      },
      {
        title: '알고리즘 - Go 언어 치트시트',
        match: ['치트시트', 'go 언어', '2차원', 'map', 'struct', '배열', '문자열'],
        extraTags: 'algorithm, go',
        description: 'Go 언어 알고리즘 풀이 치트시트: 슬라이스, 맵, 정렬, 변환',
      },
    ],
  });

  // === LFCS ===
  console.log('\n=== Splitting LFCS ===');
  total += await splitPost('LFCS.md', {
    seriesName: 'LFCS',
    groups: [
      {
        title: 'LFCS - Essential Commands (파일, 권한, 검색)',
        match: ['files', 'directories', 'permission', 'search', 'content', 'regular', 'archive', 'back up', 'logging', 'documentation', 'ssl', '속독'],
        extraTags: 'linux',
        description: 'LFCS 시험 Essential Commands 영역: 파일관리, 권한, 정규식, 아카이브',
      },
      {
        title: 'LFCS - 네트워킹 (Bridge, Bond, UFW, Netfilter)',
        match: ['네트워크', 'bridge', 'bond', 'ufw', 'netfilter', '운영 팁'],
        extraTags: 'linux, networking',
        description: 'LFCS 시험 Networking 영역: L2/L3 동작원리, Bridge, Bond, Firewall',
      },
      {
        title: 'LFCS - Operations Deployment (서비스, 부팅, 스토리지)',
        match: ['03-', '자가 점검'],
        extraTags: 'linux',
        description: 'LFCS 시험 Operations Deployment: 네트워크 동작원리, 서비스 관리',
      },
    ],
  });

  console.log(`\n=== Total: ${total} new posts created ===`);
}

main().catch(console.error);
