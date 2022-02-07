import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.css']
})
export class ListUsersComponent implements OnInit {
  userList = new Array();
  firstName: any;
  pagination : number = 1;

  constructor(private service : ApiServiceService, private route : Router) { }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(){
    this.service.getUsersList().subscribe(
      data=>{this.userList=data
        console.log(this.userList)
      },
      error=>console.log("Unsuccesfully API call")
    )
  }

  addUser(){
    this.route.navigate(['/addUser']);
  }
  
  viewUser(id : Number){
    this.route.navigate(['/user', id]);
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
           this.getUsers()
        }
      )
  }
  
  searchFilter(){ // left some work to be finish
    if(this.firstName == ""){
      this.ngOnInit();
    }else{
      this.userList = this.userList.filter(res =>{
        console.log(res.name.toLocaleLowerCase())
        console.log(this.firstName.toLocaleLowerCase())
        return res.name.toLocaleLowerCase().match(this.firstName.toLocaleLowerCase());
      })
    }
  }
  key = 'id';
  reverse : boolean = false;
  sort(key : any){
    this.key = key;
    this.reverse = !this.reverse;
  }

}
