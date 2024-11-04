import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DraftToolbarComponent } from './draft-toolbar.component';

describe('DraftToolbarComponent', () => {
  let component: DraftToolbarComponent;
  let fixture: ComponentFixture<DraftToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DraftToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DraftToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
