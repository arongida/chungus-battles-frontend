import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftMenuComponent } from './draft-menu.component';

describe('DraftMenuComponent', () => {
  let component: DraftMenuComponent;
  let fixture: ComponentFixture<DraftMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DraftMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DraftMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
