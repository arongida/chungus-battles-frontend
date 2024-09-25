import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundInfoComponent } from './round-info.component';

describe('RoundInfoComponent', () => {
  let component: RoundInfoComponent;
  let fixture: ComponentFixture<RoundInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoundInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
