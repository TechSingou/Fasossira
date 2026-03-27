import { ScheduleStatus } from '../entities/schedule.entity';
export declare class CreateScheduleDto {
    tripId: string;
    busId: string;
    date: string;
}
export declare class UpdateScheduleDto {
    busId?: string;
    status?: ScheduleStatus;
    date?: string;
}
export declare class GenerateSchedulesDto {
    tripId: string;
    busId: string;
    startDate: string;
    endDate: string;
    weekDays: number[];
}
