import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddUserComponent } from './add-user/add-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { GetUserByIDComponent } from './get-user-by-id/get-user-by-id.component';
import { ListUsersComponent } from './list-users/list-users.component';

const routes: Routes = [
 {path:'', component:ListUsersComponent},
 {path:'user/:id', component:GetUserByIDComponent},
 {path:'addUser', component:AddUserComponent},
 {path:'editUser/:id', component:EditUserComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
