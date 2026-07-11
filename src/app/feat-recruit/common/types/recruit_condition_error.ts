import { ErrorTexts } from '@/config/constants/error_texts';

export class RecruitConditionError extends Error {
    private errorMessage: string | undefined;
    constructor(errorMessage?: string) {
        super();
        this.errorMessage = errorMessage;
    }

    public getErrorMessage() {
        return this.errorMessage ?? ErrorTexts.UndefinedError;
    }
}
