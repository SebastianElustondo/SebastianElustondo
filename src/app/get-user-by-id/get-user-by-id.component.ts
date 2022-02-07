import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-get-user-by-id',
  templateUrl: './get-user-by-id.component.html',
  styleUrls: ['./get-user-by-id.component.css']
})
export class GetUserByIDComponent implements OnInit {
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
    
  editUser(id : Number){
    this.route.navigate(['/editUser', id]);
  }
  
  deleteUser(id : Number){
    if (confirm('Are you sure?'))
      this.service.deleteUser(id).subscribe(
        success =>{
          ("Product deleted succesfully");
        },
        error=> {
          console.log("Exception occured 2");
          this.route.navigate(['']);
        }
      )
  }

  redirectHome(){
    this.route.navigate([""]);
  }
}
