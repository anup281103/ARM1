import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserModel } from 'src/app/models/user-detail.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSource = new BehaviorSubject<UserModel | null>(null);
  user$ = this.userSource.asObservable();

  // 🔹 Set user globally
  setUser(user: UserModel) {
    this.userSource.next(user);
  }

  // 🔹 Get current user (sync)
  getUser(): UserModel | null {
    return this.userSource.value;
  }

  // 🔹 Clear user (e.g. logout)
  clearUser() {
    this.userSource.next(null);
  }
}
