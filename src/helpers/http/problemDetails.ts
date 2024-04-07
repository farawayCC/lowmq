import { Response } from 'express'

/** Utility function to send RFC 9457 compliant error responses */
export function sendProblemDetails(
    res: Response,
    type: string,
    status: number,
    title: string,
    detail: string,
) {
    res.status(status).json({
        type,
        title,
        status,
        detail
    })
}
