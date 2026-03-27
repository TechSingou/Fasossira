import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UserRole } from '@fasossira/shared-types';

// ─── Types ────────────────────────────────────────────────────

export interface Agency {
    id: string;
    name: string;
    city: string;
    address: string | null;
    phone: string | null;
    managerName: string | null;
    isActive: boolean;
    agentCount: number;
    activeAgentCount: number;
    createdAt: string;
}

export interface AgentSummary {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    agencyId: string | null;
    agency?: { id: string; name: string; city: string } | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    companyId: string;
}

// ─── Payloads ─────────────────────────────────────────────────

export interface CreateAgencyPayload {
    name: string;
    city: string;
    address?: string;
    phone?: string;
    managerName?: string;
}

export interface UpdateAgencyPayload extends Partial<CreateAgencyPayload> {
    isActive?: boolean;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: UserRole.ADMIN | UserRole.AGENT;
    agencyId?: string;
}

export interface UpdateUserPayload {
    name?: string;
    role?: UserRole.ADMIN | UserRole.AGENT;
    agencyId?: string;
    isActive?: boolean;
}

export interface ResetPasswordPayload { newPassword: string; }
export interface ChangePasswordPayload { currentPassword: string; newPassword: string; }

// ─── Service ──────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AgenciesUsersApiService {
    private readonly http = inject(HttpClient);
    private readonly agenciesBase = `${environment.apiUrl}/agencies`;
    private readonly usersBase    = `${environment.apiUrl}/users`;

    // ── Agencies ──────────────────────────────────────────────

    getAgencies(onlyActive = false): Observable<Agency[]> {
        const params = onlyActive ? { active: 'true' } : {};
        return this.http.get<Agency[]>(this.agenciesBase, { params });
    }

    getAgency(id: string): Observable<Agency> {
        return this.http.get<Agency>(`${this.agenciesBase}/${id}`);
    }

    getAgencyAgents(agencyId: string): Observable<AgentSummary[]> {
        return this.http.get<AgentSummary[]>(`${this.agenciesBase}/${agencyId}/agents`);
    }

    createAgency(payload: CreateAgencyPayload): Observable<Agency> {
        return this.http.post<Agency>(this.agenciesBase, payload);
    }

    updateAgency(id: string, payload: UpdateAgencyPayload): Observable<Agency> {
        return this.http.patch<Agency>(`${this.agenciesBase}/${id}`, payload);
    }

    deleteAgency(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.agenciesBase}/${id}`);
    }

    // ── Users ─────────────────────────────────────────────────

    getUsers(filters: { agencyId?: string; role?: UserRole; isActive?: boolean } = {}): Observable<User[]> {
        const params: any = {};
        if (filters.agencyId  !== undefined) params['agencyId']  = filters.agencyId;
        if (filters.role      !== undefined) params['role']       = filters.role;
        if (filters.isActive  !== undefined) params['isActive']   = String(filters.isActive);
        return this.http.get<User[]>(this.usersBase, { params });
    }

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.usersBase}/me`);
    }

    getUser(id: string): Observable<User> {
        return this.http.get<User>(`${this.usersBase}/${id}`);
    }

    createUser(payload: CreateUserPayload): Observable<User> {
        return this.http.post<User>(this.usersBase, payload);
    }

    updateUser(id: string, payload: UpdateUserPayload): Observable<User> {
        return this.http.patch<User>(`${this.usersBase}/${id}`, payload);
    }

    toggleActive(id: string): Observable<User> {
        return this.http.patch<User>(`${this.usersBase}/${id}/toggle-active`, {});
    }

    resetPassword(id: string, payload: ResetPasswordPayload): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.usersBase}/${id}/reset-password`, payload);
    }

    changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${this.usersBase}/me/change-password`, payload);
    }

    deleteUser(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.usersBase}/${id}`);
    }
}
