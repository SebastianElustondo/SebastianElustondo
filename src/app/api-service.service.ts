import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserComponent } from './user/user.component';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {
  private url = "http://localhost:8080"; // URL to web api
  
  constructor(private http: HttpClient) { }
  
  getUsersList(): Observable<any> {
    return this.http.get<any>("http://localhost:8080/getUsersList");
  }

  getUser(id : Number): Observable<any> {
    return this.http.get<any>("http://localhost:8080/getUserByID/" + id);
  }

  saveUser(user: UserComponent ): Observable<any> {
    return this.http.post<any>("http://localhost:8080/saveUser", user);
  }

  deleteUser(id : Number ): Observable<any> {
    console.log("id", id)
    return this.http.delete<any>("http://localhost:8080/deleteUser/" + id);
  }
}
