import { api } from "./api";

export interface SkillNode {
  id: string;
  cluster: number;
  owned: boolean;
  demand: number;
}

export interface SkillEdge {
  source: string;
  target: string;
  weight: number;
}

export interface SkillGraphResponse {
  nodes: SkillNode[];
  edges: SkillEdge[];
  mySkillsCount: number;
  marketSkillsCount: number;
}

export const skillsApi = {
  graph: (opts: { threshold?: number; maxEdges?: number; marketTop?: number } = {}) =>
    api
      .get<SkillGraphResponse>("/v1/skills/graph", {
        params: {
          threshold: opts.threshold,
          maxEdges: opts.maxEdges,
          marketTop: opts.marketTop,
        },
      })
      .then((r) => r.data),
};
