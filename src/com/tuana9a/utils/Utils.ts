class Utils {
    reformatString(input: any): string {
        try {
            let result: string = input.trim().replace(/\s{2,}/g, ' ');
            return result.match(/^null$/i) || result.match(/^undefined$/i) ? '' : result;
        } catch (err) {
            return '';
        }
    }
    fromAnyToNumber(input: any): number {
        try {
            let value = parseInt(input);
            return value ? value : 0;
        } catch (err) {
            return 0;
        }
    }
}

export const utils = new Utils();
