import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalentIconsComponent } from './talent-icons.component';

describe('TalentIconsComponent', () => {
  let component: TalentIconsComponent;
  let fixture: ComponentFixture<TalentIconsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentIconsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
