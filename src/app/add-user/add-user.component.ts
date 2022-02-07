import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {
  user = new UserComponent();

  constructor(private service : ApiServiceService, private route : Router) { }

  ngOnInit(): void {
  }

  addUser(){
    this.service.saveUser(this.user).subscribe(
      data=>{
        console.log("Added succesfully"),
        this.redirectHome()
      },
      error=>console.log("error")
    );
  }

  redirectHome(){
    this.route.navigate([""]);
  }

}
