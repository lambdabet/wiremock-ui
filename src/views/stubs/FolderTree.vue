<script setup lang="ts">
import type {TreeNodeData} from "element-plus/es/components/tree/src/tree.type";
import type Node from 'element-plus/es/components/tree/src/model/node'
import {type IFolderTree, UseFolderStore} from "@/stores/UseFolderStore";
import {ref} from "vue";
import {ElMessageBox, ElTree} from "element-plus";
import {storeToRefs} from "pinia";
import {Delete, Plus} from "@element-plus/icons-vue";

const treeRef = ref<InstanceType<typeof ElTree>>()
const folderStore = UseFolderStore()
const {currentFolder, folderTree, folderFlat} = storeToRefs(folderStore)

// 为当前节点添加选中样式
const currentNodeClass = (data: TreeNodeData, node: Node) => {
  return getFolderPath(node) === currentFolder.value ? 'is-selected' : ''
}

// 文件夹节点点击，选中或取消->设置或取消store currentFolder
const handleFolderNodeClick = (data: IFolderTree, node: Node) => {
  const path = getFolderPath(node)
  // 点击已经选中节点->取消选中
  currentFolder.value = currentFolder.value === path ? '' : path
}

// 获取一个节点从顶端到当前节点的完整路径
const getFolderPath: any = (n: Node) => n.level >= 1 ? getFolderPath(n.parent) + '/' + n.data.label : ''

// 新增文件夹
const addFolder = () => {
  ElMessageBox.prompt('请输入文件夹名称', '新建', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    // inputPattern: /^((?!\/).)+$/,
    // inputErrorMessage: '勿包含/',
    inputValidator: val => {
      if(/\//.test(val)) return '请勿包含/'
      // 验证当前文件夹下不存在同名文件夹
      if (folderFlat.value.includes(currentFolder.value + '/' + val)) return `当前文件夹下已经存在“${val}”`
      return true

    }
  }).then(({value}) => {
    const pathArray = currentFolder.value.split('/')
    let child = folderTree.value
    for (let i = 1; i < pathArray.length; i++) {
      const node = child.find(n => n.label === pathArray[i])
      if(!node) throw new Error('folder path not exist: ' + currentFolder.value)
      if(!node.children) node.children = []
      child = node.children
    }
    child.push({label: value})
    child.sort((a, b) => a.label.localeCompare(b.label))
  }).catch(() => {
  })
}

// 删除当前选中的文件夹
const deleteCurrent = () => {
  const pathArray = currentFolder.value.split('/')
  let child = folderTree.value
  for (let i = 1; i < pathArray.length; i++) {
    const idx = child.findIndex(n => n.label === pathArray[i])
    if (i === pathArray.length-1) {
      child.splice(idx, 1)
    } else {
      child = child[idx].children || []
    }
  }
  currentFolder.value = ''
}
</script>

<template>
  <el-row class="tree-title">
    <span>文件夹</span>
    <div class="handle-btn">
      <el-button
          :icon="Plus"
          type="primary"
          size="small"
          text
          @click="addFolder"
      ></el-button>
      <el-popconfirm title="确定删除吗？" @confirm="deleteCurrent" width="150">
        <template #reference>
          <el-button
              v-if="currentFolder"
              :icon="Delete"
              type="danger"
              size="small"
              text
          ></el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-row>
  <el-scrollbar class="tree-container">
    <el-tree
        ref="treeRef"
        :data="folderTree"
        :props="{ class: currentNodeClass }"
        default-expand-all
        @node-click="handleFolderNodeClick"
        :expand-on-click-node="false"
    />
  </el-scrollbar>
</template>

<style scoped lang="less">
:deep(.is-selected) {
  & > .el-tree-node__content {
    color: #409eff;
    transition: color .25s;
    background-color: rgb(64 158 255 / 30%)
  }
}

.tree-container {
  border: 1px solid #dfdfdf;
  height: calc(100vh - 110px);
}

.tree-title {
  font-size: 12px;
  line-height: 24px;
  color: gray;
  display: flex;

  & > span {
    flex: 1;
  }

  .handle-btn {
    padding-right: 5px;

    .el-button {
      padding: 6px;
      margin: 0;
    }
  }
}

</style>
