import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PssScoreBarComponent } from './pss-score-bar.component';

describe('PssScoreBarComponent', () => {
  let component: PssScoreBarComponent;
  let fixture: ComponentFixture<PssScoreBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PssScoreBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PssScoreBarComponent);
    component = fixture.componentInstance;
  });

  function setScore(score: number) {
    fixture.componentRef.setInput('score', score);
    fixture.detectChanges();
  }

  describe('scoreClass', () => {
    it('should return pss-error for a score below the error threshold', () => {
      setScore(3);
      expect(component['scoreClass']()).toBe('pss-error pss-score-3');
    });

    it('should return pss-warning for a score at the error threshold', () => {
      setScore(4);
      expect(component['scoreClass']()).toBe('pss-warning pss-score-4');
    });

    it('should return pss-warning for a score between the error and warning thresholds', () => {
      setScore(5);
      expect(component['scoreClass']()).toBe('pss-warning pss-score-5');
    });

    it('should return pss-warning for a score at the warning threshold', () => {
      setScore(6);
      expect(component['scoreClass']()).toBe('pss-warning pss-score-6');
    });

    it('should return pss-success for a score above the warning threshold', () => {
      setScore(7);
      expect(component['scoreClass']()).toBe('pss-success pss-score-7');
    });
  });
});
