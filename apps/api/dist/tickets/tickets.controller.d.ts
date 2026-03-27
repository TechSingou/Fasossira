import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    getTicket(companyId: string, reference: string): Promise<import("./tickets.service").TicketDto>;
}
