import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadyButtonComponent } from './ready-button.component';

describe('DraftMenuComponent', () => {
  let component: ReadyButtonComponent;
  let fixture: ComponentFixture<ReadyButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadyButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadyButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
