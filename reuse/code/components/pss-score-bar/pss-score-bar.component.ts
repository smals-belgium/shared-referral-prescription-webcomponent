import { Component, computed, input } from '@angular/core';
import { PSS_ERROR_SCORE, PSS_WARNING_SCORE } from '@reuse/code/constants/pss.constants';

@Component({
  selector: 'app-pss-score-bar',
  templateUrl: './pss-score-bar.component.html',
  styleUrl: './pss-score-bar.component.scss',
})
export class PssScoreBarComponent {
  readonly score = input.required<number>();

  // derives the visual state (error/warning/success + bar width) from the score thresholds
  protected readonly scoreClass = computed(() => {
    const score = this.score();
    const level = this.getScoreLevel(score);
    return `${level} pss-score-${score}`;
  });

  private getScoreLevel(score: number): 'pss-error' | 'pss-warning' | 'pss-success' {
    if (score < PSS_ERROR_SCORE) {
      return 'pss-error';
    }

    if (score > PSS_WARNING_SCORE) {
      return 'pss-success';
    }

    return 'pss-warning';
  }
}
