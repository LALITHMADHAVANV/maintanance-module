import { useMemo, useCallback } from 'react';
import { mockUsers, mockSpecialistSkills, PROBLEM_TYPES } from '../services/mockData';

export function useSpecialists() {
  const technicians = useMemo(() =>
    mockUsers.filter(u => u.role === 'technician'),
  []);

  const skills = useMemo(() => mockSpecialistSkills, []);

  const findSpecialists = useCallback((problemTypeId) => {
    const problem = PROBLEM_TYPES.find(p => p.id === problemTypeId);
    if (!problem) return [];

    const category = problem.category;

    // Find technicians with matching skills
    const matchingSkills = skills.filter(s => s.skill_category === category);

    const specialists = matchingSkills.map(skill => {
      const tech = technicians.find(t => t.id === skill.user_id);
      if (!tech) return null;
      return {
        ...tech,
        skill_category: skill.skill_category,
        expertise_level: skill.expertise_level,
        machines_handled: skill.machines_handled,
        // Score: expert=3, intermediate=2, beginner=1, online bonus=1
        score: (skill.expertise_level === 'expert' ? 3 :
                skill.expertise_level === 'intermediate' ? 2 : 1)
               + (tech.online_status ? 1 : 0)
               + (skill.machines_handled > 50 ? 1 : 0),
      };
    }).filter(Boolean);

    // Sort by score (best first)
    return specialists.sort((a, b) => b.score - a.score);
  }, [technicians, skills]);

  const getBestSpecialist = useCallback((problemTypeId) => {
    const specialists = findSpecialists(problemTypeId);
    return specialists.length > 0 ? specialists[0] : null;
  }, [findSpecialists]);

  const getSkillsForTechnician = useCallback((techId) => {
    return skills.filter(s => s.user_id === techId);
  }, [skills]);

  return {
    technicians,
    skills,
    findSpecialists,
    getBestSpecialist,
    getSkillsForTechnician,
    problemTypes: PROBLEM_TYPES,
  };
}
