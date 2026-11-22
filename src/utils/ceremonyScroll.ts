import type Lenis from 'lenis';
import { CEREMONY_SLIDES } from '../data/ceremonies';

type VirtualScroll = NonNullable<ConstructorParameters<typeof Lenis>[0]>['virtualScroll'];
const ceremonyCount = CEREMONY_SLIDES.length;

export function ceremonyStep(showcase: HTMLElement, stage: HTMLElement) {
  return Math.max(1, (showcase.offsetHeight - stage.offsetHeight) / ceremonyCount);
}

export function createCeremonyScroll(
  showcase: HTMLElement,
  stage: HTMLElement,
  move: (target: number) => void,
): NonNullable<VirtualScroll> {
  let lastWheel = -Infinity;
  let wheelConsumed = false;
  let touchConsumed = false;
  let touchTravel = 0;

  return ({ deltaX, deltaY, event }) => {
    if (event instanceof WheelEvent && event.ctrlKey) return true;

    const wheel = event.type === 'wheel';
    if (wheel) {
      if (event.timeStamp - lastWheel > 160) wheelConsumed = false;
      lastWheel = event.timeStamp;
    } else if (event.type === 'touchstart') {
      touchConsumed = false;
      touchTravel = 0;
      return true;
    }

    if (wheel ? wheelConsumed : touchConsumed) {
      if (event.cancelable) event.preventDefault();
      return false;
    }

    if (Math.abs(deltaY) <= Math.abs(deltaX) || !event.cancelable) return true;

    const step = ceremonyStep(showcase, stage);
    const scroll = window.scrollY;
    const relative = -showcase.getBoundingClientRect().top;
    // Include one final hold so Reception is fully visible before the next section covers it.
    const length = step * ceremonyCount;
    const projected = relative + deltaY;
    const entering = deltaY > 0
      ? relative < -1 && projected >= -1
      : relative > length && projected <= length;
    const inside = relative >= -1 && relative <= length;
    if (!inside && !entering) return true;

    if (!wheel && event.type === 'touchmove') {
      touchTravel += deltaY;
      if (Math.abs(touchTravel) < 18) {
        event.preventDefault();
        return false;
      }
    }

    const last = ceremonyCount - 1;
    const stops = Array.from({ length: ceremonyCount }, (_, index) =>
      index === 0 ? 0 : (index + 0.12) * step,
    );
    const target = entering
      ? stops[deltaY > 0 ? 0 : last]
      : deltaY > 0
        ? stops.find((stop) => stop > relative + 2)
        : stops.reverse().find((stop) => stop < relative - 2);
    if (target === undefined) return true;

    event.preventDefault();
    if (wheel) wheelConsumed = true;
    else touchConsumed = true;
    move(scroll - relative + target);
    return false;
  };
}
