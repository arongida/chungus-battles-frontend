import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillIconsComponent } from './skill-icons.component';

describe('SkillIconsComponent', () => {
  let component: SkillIconsComponent;
  let fixture: ComponentFixture<SkillIconsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillIconsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillIconsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
