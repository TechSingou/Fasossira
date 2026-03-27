import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
//import { LoginDto, RefreshTokenDto, AuthTokens } from '../../../../../../libs/shared-types/src/index';
import { LoginDto, RefreshTokenDto, AuthTokens } from '@fasossira/shared-types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auth`;

  login(dto: LoginDto): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/login`, dto);
  }

  refresh(dto: RefreshTokenDto): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/refresh`, dto);
  }

  me(): Observable<AuthTokens['user']> {
    return this.http.get<AuthTokens['user']>(`${this.base}/me`);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {});
  }
}
