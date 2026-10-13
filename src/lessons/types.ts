export interface Quiz {
  q: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** Shown once answered: should teach something beyond "correct". */
  explain: string;
}

export interface Step {
  title?: string;
  /** Lesson prose (HTML, may contain MathML). */
  html?: string;
  widget?: (host: HTMLElement) => void;
  /** Interpretation shown below the widget. */
  after?: string;
  quiz?: Quiz;
}

export interface Lesson {
  id: string;
  title: string;
  blurb: string;
  /** Slide numbers covered, as printed in the deck footer. */
  slides: string;
  steps: Step[];
}
