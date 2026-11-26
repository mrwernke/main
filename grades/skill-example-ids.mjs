import { families as transformations } from '../math-applets/function-transformations/model.mjs';
import { families as features } from '../math-applets/absolute-value-features/model.mjs';
import { guidedProblems, challengeProblems } from '../math-applets/absolute-value-equations/model.mjs';
import { standardPractice, factoredPractice, vertexPractice } from '../math-applets/quadratic-graphing/model.mjs';
import { exercises as graphExercises } from '../math-applets/quadratic-from-graph/model.mjs';
import { practice as conversion } from '../math-applets/quadratic-convert/model.mjs';
import { examples as stories } from '../math-applets/quadratic-story-sketch/model.mjs';
import { examples as extrema } from '../math-applets/quadratic-extrema/model.mjs';
import { examples as realWorld } from '../math-applets/quadratic-real-world-solutions/model.mjs';
import { problems as graphSolutions } from '../math-applets/quadratic-graph-solutions/model.mjs';
import { problems as discriminant } from '../math-applets/quadratic-discriminant/model.mjs';
import { problems as methodChoice } from '../math-applets/quadratic-method-choice/model.mjs';
import { problems as formula } from '../math-applets/quadratic-formula/model.mjs';
import { exercises as monic, nonMonicExercises } from '../math-applets/quadratic-factoring/model.mjs';
import { problems as squareRoot } from '../math-applets/quadratic-square-root/model.mjs';
import { problems as completingSquare } from '../math-applets/quadratic-completing-square/model.mjs';
import { examples as modeling } from '../math-applets/quadratic-modeling/model.mjs';
import { systems } from '../math-applets/quadratic-systems/model.mjs';
import { problems as polynomialStandard } from '../math-applets/polynomial-standard-graphing/model.mjs';
import { problems as polynomialFactored } from '../math-applets/polynomial-factored-graphing/model.mjs';
import { problems as polynomialFeatures } from '../math-applets/polynomial-features/model.mjs';
import { problems as polynomialSolutions } from '../math-applets/polynomial-graph-solutions/model.mjs';
import { examples as polynomialFromGraph } from '../math-applets/polynomial-from-graph/model.mjs';
import { examples as polynomialFromRoots } from '../math-applets/polynomial-from-roots/model.mjs';
import { factorPractice, groupingPractice, quadraticFormPractice, sections } from '../math-applets/polynomial-factoring/model.mjs';
import { examples as longDivision } from '../math-applets/polynomial-long-division/model.mjs';
import { examples as syntheticDivision } from '../math-applets/polynomial-synthetic-division/model.mjs';
import { examples as givenFactor } from '../math-applets/polynomial-given-factor/model.mjs';
import { examples as rationalRoots } from '../math-applets/polynomial-rational-roots/model.mjs';
import { problems as contextGraphs } from '../math-applets/polynomial-context-graphs/model.mjs';

const ids = (length, prefix = '') => Array.from({ length }, (_, i) => `${prefix}${i}`);
const p8Sections = [factorPractice, groupingPractice, quadraticFormPractice];
const p8Ids = [
  ...p8Sections.flatMap((examples, section) => ids(examples.length, `t0-s${section}-`)),
  ...sections.flatMap((section, index) => ids(section.examples.length, `t1-s${index}-`)),
];
const contextIds = ids(contextGraphs.length);

export const skillExampleIds = {
  FT4A: ids(transformations.generic.length), FT9: ids(8),
  FT10: ids(features.absolute.length), FT12: ids(transformations.absolute.length),
  FT13: [...ids(guidedProblems.length, 'guided-'), ...ids(challengeProblems.length, 'solo-')],
  Q1: ids(standardPractice.length), Q2: ids(factoredPractice.length), Q3: ids(vertexPractice.length),
  Q4: ids(features.quadratic.length), Q5: ids(transformations.quadratic.length),
  Q6: ids(graphExercises.length), Q7: ids(conversion.length), Q8: ids(stories.length),
  Q9: ids(extrema.length), Q10: ids(realWorld.length), Q11: ids(graphSolutions.length),
  Q12: ids(discriminant.length), Q13: ids(methodChoice.length), Q14: ids(formula.length),
  Q15: [...ids(monic.length, 'monic-'), ...ids(nonMonicExercises.length, 'nonmonic-')],
  Q16: ids(squareRoot.length), Q17: ids(completingSquare.length), Q18: ids(modeling.length),
  Q19: ids(systems.length), P1: ids(polynomialStandard.length), P2: ids(polynomialFactored.length),
  P3: ids(polynomialFeatures.length), P4: ids(polynomialFeatures.length), P5: ids(polynomialSolutions.length),
  P6: ids(polynomialFromGraph.length), P7: ids(polynomialFromRoots.length), P8: p8Ids,
  P9: ids(longDivision.length), P10: ids(syntheticDivision.length), P11: ids(givenFactor.length),
  P12: ids(rationalRoots.length), P13: contextIds, P14: contextIds, P15: contextIds, P16: contextIds,
};
