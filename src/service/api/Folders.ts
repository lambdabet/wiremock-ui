import { httpSingle } from '@/lib/axios';

/**
 * 借用当前wiremock服务，建立一固定接口，存储文件夹配置
 */


/**
 * 获取文件夹
 * @returns {*}
 */
export const getFolders = (mockUrl: string): any => {
    return httpSingle({
        url: `${mockUrl}/__wiremock-ui/folders`,
        method: 'post',
    })
}
