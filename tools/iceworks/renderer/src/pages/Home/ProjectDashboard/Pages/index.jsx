/**
 * 获取当前页面项目的所有 page
 */

import { inject, observer } from 'mobx-react';
import { ipcRenderer } from 'electron';
import fs from 'fs';
import path from 'path';
import React, { Component } from 'react';
import dayjs from 'dayjs';

import { readdirSync } from '../../../../lib/file-system';
import DashboardCard from '../../../../components/DashboardCard/';
import ExtraButton from '../../../../components/ExtraButton/';
import Icon from '../../../../components/Icon';
import EmptyTips from '../../../../components/EmptyTips';

import './index.scss';

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD hh:mm');
}

function recursivePagesSync(dirPath, rootDir) {
  const list = [];
  let stats;
  const files = readdirSync(dirPath);
  files.forEach(function(file) {
    let fullPath = path.join(dirPath, file);
    stats = fs.lstatSync(fullPath);
    if (stats.isDirectory()) {
      const { atime, birthtime, ctime, mtime } = stats;
      list.push({
        name: path.relative(rootDir, fullPath),
        fullPath,
        atime: formatDate(atime),
        birthtime: formatDate(birthtime),
        ctime: formatDate(ctime),
        mtime: formatDate(mtime),
      });
    }
  });

  return list;
}

@inject('projects', 'newpage', 'pageBlockPicker')
@observer
class PagesCard extends Component {
  static extensionName = 'pages';

  constructor(props) {
    super(props);

    this.state = {
      pages: [],
    };
  }

  UNSAFE_componentWillMount() {
    this.serachPages();
  }

  componentDidMount() {
    ipcRenderer.on('focus', this.serachPages);
    this.props.projects.on('change', this.serachPages);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('focus', this.serachPages);
    this.props.projects.removeListener('change', this.serachPages);
  }

  serachPages = () => {
    const { projects } = this.props;
    const { currentProject } = projects;

    if (currentProject && currentProject.fullPath) {
      const pagesDirectory = currentProject.isNodeProject
        ? path.join(currentProject.fullPath, 'client/pages')
        : path.join(currentProject.fullPath, 'src/pages');
      const pages = recursivePagesSync(pagesDirectory, pagesDirectory);
      this.setState({ pages: pages });
    } else {
      this.setState({ pages: [] });
    }
  };

  handleCreatePage = () => {
    const { projects } = this.props;
    this.props.newpage.setTargetPath(projects.currentProject.fullPath);
    this.props.newpage.toggle();
  };

  handleDeletePage = (fullPath, name) => {
    // todo 删除 page
    console.log(fullPath, name);
  };

  handlePageAddBlock(fullPath, name) {
    // todo 增加 block 到指定页面中
    this.props.pageBlockPicker.open({
      blocksPath: fullPath,
      projectPath: this.props.projects.currentProject.fullPath,
      pageName: name,
    });
  }

  renderTipContent = (page) => {
    return (
      <div className="page-tip-content">
        <div className="page-info-item">
          <span>创建时间：</span>
          <span>{page.birthtime}</span>
        </div>
      </div>
    );
  };

  renderPageList = () => {
    const { pages } = this.state;
    if (pages && pages.length == 0) {
      return <EmptyTips>暂无页面</EmptyTips>;
    }
    return pages.map((page) => {
      return (
        <div className="page-item" key={page.name} data-path={page.fullPath}>
          <div className="name">{page.name}</div>
          <div className="operational">
            <ExtraButton
              style={{ color: '#3080FE' }}
              placement={'top'}
              tipContent={() => this.renderTipContent(page)}
            >
              <Icon
                type="time"
                style={{ fontWeight: 'bold', fontSize: '14px' }}
              />
            </ExtraButton>
            <ExtraButton
              style={{ color: '#3080FE' }}
              placement={'top'}
              tipText="添加区块"
              onClick={this.handlePageAddBlock.bind(
                this,
                page.fullPath,
                page.name
              )}
            >
              <Icon type="block-add" />
            </ExtraButton>
          </div>
        </div>
      );
    });
  };

  render() {
    const { pages } = this.state;
    return (
      <DashboardCard>
        <DashboardCard.Header>
          <div>
            页面列表
            <span style={{ paddingLeft: 10, fontSize: 12, color: '#666' }}>
              ({pages.length})
            </span>
          </div>
          <div>
            <ExtraButton
              style={{ color: '#3080FE' }}
              placement={'top'}
              tipText={'刷新'}
              onClick={this.serachPages}
            >
              <Icon type="reload" style={{ fontSize: 18 }} />
            </ExtraButton>
            <ExtraButton
              style={{ color: '#3080FE' }}
              placement={'top'}
              tipText={'新建页面'}
              onClick={this.handleCreatePage}
            >
              <Icon type="plus-o" style={{ fontSize: 18 }} />
            </ExtraButton>
          </div>
        </DashboardCard.Header>
        <DashboardCard.Body>{this.renderPageList()}</DashboardCard.Body>
      </DashboardCard>
    );
  }
}

export default PagesCard;
