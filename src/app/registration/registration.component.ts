import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  user = {name:"", email:"", password:"",confirmPassword:"", role:""}
  constructor() { }

  ngOnInit(): void {
  }

  AdminForm(){
    console.log(this.user)
    //TODO
  }
}
