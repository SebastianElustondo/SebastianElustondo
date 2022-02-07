import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  user = new UserComponent();

  constructor(private service : ApiServiceService, private route : Router, private activatedRoute : ActivatedRoute) { }

  ngOnInit() {
    this.getUser(this.activatedRoute.snapshot.params['id']);
  }
  
  getUser(id: Number){
    this.service.getUser(id).subscribe(
      data=>{
        console.log("Succesfully bring from DB");
        this.user = data
      },
      error=>{
        console.log("Error")
      }
    )
  }

  EditUser(){
    this.service.saveUser(this.user).subscribe(
      data=>{
        console.log("Edited succesfully"),
        this.redirectHome()
      },
      error=>console.log("error")
    );
  }

  redirectHome(){
    this.route.navigate([""]);
  }
}
