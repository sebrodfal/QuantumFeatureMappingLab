import { C } from '../data/constants';

/* Classifies the selected record's outcome relative to its known condition
   and the ALERT / NO ALERT decision, for the small secondary status label. */
export function decisionStatus(actualLabel, alertFlag) {
  if (actualLabel === 0 && alertFlag) {
    return { label: 'False alarm', color: C.deviation };
  }

  if (actualLabel === 1 && !alertFlag) {
    return { label: 'Missed deviation', color: C.warning };
  }

  if (actualLabel === 0 && !alertFlag) {
    return { label: 'Correctly classified as healthy', color: C.healthy };
  }

  return { label: 'Correctly detected deviation', color: C.positive };
}
