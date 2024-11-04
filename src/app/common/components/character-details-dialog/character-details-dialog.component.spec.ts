import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterDetailsDialogComponent } from './character-details-dialog.component';

describe('CharacterDetailsComponent', () => {
  let component: CharacterDetailsDialogComponent;
  let fixture: ComponentFixture<CharacterDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterDetailsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
