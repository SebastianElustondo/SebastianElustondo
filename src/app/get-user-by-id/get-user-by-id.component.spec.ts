import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetUserByIDComponent } from './get-user-by-id.component';

describe('GetUserByIDComponent', () => {
  let component: GetUserByIDComponent;
  let fixture: ComponentFixture<GetUserByIDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GetUserByIDComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetUserByIDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
