<script setup>
import card from "@/views/home/component/card.vue";
</script>

<template>
  <div class="content">
    <div class="release column-flex">
      <h2 class="title">最新发布</h2>
      <card class="release-card "></card>
      <card class="release-card"></card>
      <card class="release-card"></card>
      <card class="release-card"></card>
      <card class="release-card"></card>
      <card class="release-card "></card>
      <card class="release-card "></card>
      <card class="release-card "></card>
      <card class="release-card "></card>
      <div class="page">
        <div class="page-box">
          <button class="page-button-active">1</button>
          <button>2</button>
          <button>3</button>
          <button>></button>
        </div>
      </div>
    </div>
    <div class="right-container">
      <div class="category column-flex">
      <h2 class="title">分类</h2>
        <br>
      <div class="category-card hover-scale-to-wide">
        <span>HTML</span>
        <span>10</span>
      </div>
      <div class="category-card hover-scale-to-wide">
        <span>CSS</span>
        <span>10</span>
      </div>
      <div class="category-card hover-scale-to-wide">
        <span>JavaScript</span>
        <span>10</span>
      </div>
      <div class="category-card hover-scale-to-wide">
        <span>Vue</span>
        <span>10</span>
      </div>
    </div>
      <div class="tag">
        <h2 class="title">标签</h2>
        <div class="tag-flex-box">
        <div class="tag-card hover-scale-to-wide">
          <span>HTML</span>
          &nbsp;
          <span>10</span>
        </div>
        <div class="tag-card hover-scale-to-wide">
          <span>CSS</span>
          &nbsp;
          <span>10</span>
        </div>
        <div class="tag-card hover-scale-to-wide">
          <span>JavaScript</span>
          &nbsp;
          <span>10</span>
        </div>
        <div class="tag-card hover-scale-to-wide">
          <span>Vue</span>
          &nbsp;
          <span>5</span>
        </div>
        </div>
        <div class="more-tag-box">
          <a href="#" class="more-tag">更多标签&nbsp;-></a>
        </div>
      </div>
    </div>
  </div>


</template>

<style scoped>
/*title类*/
.title{
  color:rgb(245, 95, 94);
  font-size: 30px;
  margin: 20px;
}
.column-flex{
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}
.content {
  border: cornflowerblue 5px solid;
  display: flex;
  /*在底部加一个淡淡的分割线*/
  border-bottom: 1px solid rgba(30, 30, 30, 0.3);
  /*给release和分类进行7 3分*/
     .release {
      height: 100%;
      flex: 7;
      border: brown 5px solid;
        .release-card{
          /* 发布的文章,每个卡片之间的间距 */
         &:not(:first-child) {
          margin-top: 20px;
         }
      }
       .page{
         background: #f8e6e7;
         height: 150px;
         display: flex;
         justify-content: center;
         align-items: center;
         .page-box button{
           border-style: none;
           height: 45px;
           width: 45px;
           border-radius: 10px;
           margin-left: 10px;
           &:hover{
             cursor: pointer;
             background-color: rgb(245, 125, 124);
           }
          }
         }
       }
  }
.page-button-active{
  background-color: rgb(245, 85, 85);
}
  .right-container{
    position: sticky;   /* 核心：粘性定位 */
    top: 100px;/* 核心：设置粘性定位的偏移量 */

    height: 800px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 3;
  }
  .category {
    border: blueviolet 5px solid;
      .category-card{
        display: flex;
        justify-content: space-between;
        background: rgba(248, 231, 231);
        box-sizing: border-box;
        border: cornflowerblue 2px solid;
        /* 分类卡片的高度 */
        height: 60px;
        /*卡片圆角*/
        border-radius: 10px;
        /* 分类,每个卡片之间的间距 */
        padding-left: 20px;
        padding-right: 20px;
        /* 分类卡片的文字垂直居中 */
        line-height: 50px;
       &:not(:first-child) {
        margin-top: 10px;
       }
      }
  }
  .tag{
    border: cornflowerblue 5px solid;
    height: 250px;
    /*超出宽度换行*/
    .tag-flex-box{
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      .tag-card{
        height: 50px;
        /* 标签卡片的文字垂直居中 */
        line-height: 50px;
        padding-left: 10px;
        padding-right: 10px;
        border-radius: 10px;
        background: rgba(248, 231, 231);
      }
    }
    .more-tag-box {
      /*这只是为了让超链接靠右边*/
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      .more-tag {
        /* 靠右侧，在底部 */
        text-decoration: none;
        color: rgb(153, 153, 159);
        font-size: 20px;
        &:hover {
          cursor: pointer;
        }
      }
    }
  }



</style>
