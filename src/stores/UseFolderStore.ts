import {defineStore} from "pinia";
import {computed, ref, watch} from "vue";
import {getFolders} from "@/service/api/Folders";
import {ErrorHandler} from "@/lib/axios";
import {type IStubMapping, C_Mapping, U_Mapping, R_MappingByFolder} from "@/service/api/StubMappings";

export interface IFolderTree {
    label: string // 文件夹名称
    children?: IFolderTree[] // 下级文件夹
}

export const UseFolderStore = defineStore('folderStore', () => {
    // 当前选中的folder
    const currentFolder = ref('')
    // 全部folder tree数据
    const folderTree = ref([] as IFolderTree[])

    // 奖folder tree扁平化处理，用于新增接口时选择
    const flatTree: any = (tree: IFolderTree[], parent = '') => {
        return tree.map(node => {
            const path = parent + '/' + node.label
            return node.children ?
                [path, flatTree(node.children, path)] : path
        }).flat(Infinity)
    }
    const folderFlat = computed(() => flatTree(folderTree.value))

    /**
     * 初始化folder tree
     * 将数据缓存在当前wiremock服务的一固定接口中
     * 初始化时调用此接口，若存在直接初始化folder tree
     * 若不存在，调用全部mapping，从metadata中生成folder tree并保存到指定的接口中
     */
    const initFolderTreeValue = (mockUrl: string) => {
        getFolders(mockUrl).catch(() => {
            return createFolderMapping(mockUrl)
        }).then((data: IFolderTree[]) => {
            folderTree.value = data
        }).then(() => {
            watch(folderTree, (newVal) => {
                updateFolderMapping(mockUrl, newVal)
            }, { deep: true })
        }).catch((err: any) => {
            ErrorHandler.create(err).end()
        })
    }
    return {currentFolder, folderTree, folderFlat, initFolderTreeValue}
})

/**
 * 从当前所有mapping中获取文件夹路径，生成folder tree，并保存文件夹配置的mapping
 *
 * 从当前所有mapping中获取文件夹路径的目的是防止手动删除folder tree mapping后，可自动重新建立folder tree
 * @param mockUrl
 */
const createFolderMapping = (mockUrl: string): Promise<IFolderTree[]> => {
    return R_MappingByFolder(mockUrl, '/.*').then((res: any) => {
        const tree: IFolderTree[] = []
        const paths = (res.mappings as Array<any> || [])
            .map((item: any) => item.metadata?.wmui.folder as string || '')
            .sort((a ,b) => a.localeCompare(b))
        // 将存储path映射为tree
        for (const path of paths) {
            const array = path.split('/')
            let child = tree
            for (let i = 1; i < array.length; i++) {
                let node = child.find(n => n.label === array[i])
                if (!node) {
                    node = {label: array[i]}
                    child.push(node)
                }
                if (!node.children) node.children = []
                child = node.children
            }
        }
        return tree
    }).then(tree => {
        C_Mapping(mockUrl, generateMappingParam(tree))
        return tree
    })
}

/**
 * 更新folder tree mapping的数据
 * @param mockUrl
 * @param treeData
 */
const updateFolderMapping = (mockUrl: string, treeData: IFolderTree[]) => {
    const param = generateMappingParam(treeData)
    U_Mapping(mockUrl, param.uuid as string, param)
}

/**
 * folder tree mapping的元数据
 * @param treeData
 */
const generateMappingParam = (treeData: any) => {
    return {
        "id": "00000000-0000-0000-0000-000000000000",
        "name": "wiremock-ui自动生成，请勿删除",
        "request": {
            "urlPath": "/__wiremock-ui/folders",
            "method": "POST"
        },
        "response": {
            "status": 200,
            "jsonBody": treeData,
            "headers": {
                "Content-Type": "application/json"
            }
        },
        "uuid": "00000000-0000-0000-0000-000000000000"
    }  as IStubMapping
}
