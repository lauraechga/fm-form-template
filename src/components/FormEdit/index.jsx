import React, { PureComponent } from 'react';
import { Form, Icon, Toast, toast } from 'hoi-poi-ui';
import { bridge } from 'fm-bridge';
// import FormValidator from '../FormValidator';
import FormSummary from '../FormSummary';

import './style.scss';

class FormsEdit extends PureComponent {
  state = { currentPage: 0, showSummary: false, errors: {} };

  constructor(props) {
    super(props);
    this.state.totalPages = props.schema.length;
  }

  componentDidUpdate(prevState) {
    const { currentPage } = this.state;
    const { schema, setImagesView, imagesView, onChangePage } = this.props;
    const pageSchema = schema[currentPage];

    if (this.state.currentPage !== prevState.currentPage) {
      onChangePage(currentPage);
    }

    if (pageSchema && pageSchema.imagesView && !imagesView) {
      bridge
        .showCameraImages()
        .then(() => {
          setImagesView(true);
        })
        .catch((err) => {
          console.warn(err);
        });
    } else if (!pageSchema || (imagesView && !pageSchema.imagesView)) {
      bridge
        .hideCameraImages()
        .then(() => {
          setImagesView(false);
        })
        .catch((err) => {
          console.warn(err);
        });
    }
  }

  validate = () => {
    return new Promise((resolve, reject)=>{
      const { schema, formData } = this.props;
      const { currentPage } = this.state;
      const pageSchema = schema[currentPage];
      let allValid = true;

      function validateFields(fields, values) {
        let errors = {};
        fields.forEach(element => {
          if (element.type === 'multiplier') {
              if (!errors[element.name]) errors[element.name] = [];
              if (!values) {
                errors[element.name] = element.schema[0].fields.map((field) => validateFields(element.schema[0].fields, values));
              } else {
                 const multiplierValues = values[element.name] ?  values[element.name] : [];
                errors[element.name] = multiplierValues.map((values) => validateFields(element.schema[0].fields, values));
              }
          } else {
            if (element.isRequired && (!values || !values[element.name])) {
              allValid = false;
              errors[element.name] = 'This field is requiered';
            }
          }
        });
        return errors;
      }

      let errors = validateFields(pageSchema.fields, formData.formObject[schema[currentPage].name]);

      if (allValid) {
        this.setState({errors: {}});
        resolve();
      } else {
        this.setState({errors});
        reject({ type: 'invalid' });
      }
    });
  };

  onClickPrev = (event) => {
    const { formData } = this.props;
    const { currentPage } = this.state;

    if (currentPage > 0) {
      bridge
        .showLoading()
        .then(() => bridge.saveData(formData))
        .then(() => {
          this.setState({ currentPage: currentPage - 1 });
          bridge.hideLoading();
        })
        .catch((err) => {
          if (err.type === 'invalid') {

          } else {
            console.warn(err);
            toast({
              type: 'error',
              text: 'The form could not be saved',
              title: 'Error',
            });
          }
          bridge.hideLoading();
      });
    }
  };

  onClickNext = (event) => {
    const { formData } = this.props;
    const { currentPage } = this.state;

    bridge
      .showLoading()
      // .then(() => this.validate())
      .then(() => bridge.saveData(formData))
      .then(() => {
        this.setState({ currentPage: currentPage + 1 });
        bridge.hideLoading();
      })
      .catch((err) => {
        if (err.type === 'invalid') {

        } else {
          console.warn(err);
          toast({
            type: 'error',
            text: 'The form could not be saved',
            title: 'Error',
          });
        }
        bridge.hideLoading();
      });
  };

  onFormChange = (values, field) => {
    const { onChange } = this.props;
    const { currentPage } = this.state;

    onChange(values, field, currentPage);
  };

  onFieldFocus = (values, field) => {
    const { onFocus } = this.props;
    const { currentPage } = this.state;

    onFocus(values, field, currentPage);
  };

  onClickFinish = () => {
    const { formData } = this.props;

    formData.endState =  1;
    bridge.saveData(formData)
      .then(() => bridge.finishActivity())
      .catch((err) => {
        console.warn(err);
          toast({
            type: 'error',
            text: 'The form could not be saved',
            title: 'Error',
          });
      });
  };

  renderPrev() {
    const { currentPage } = this.state;

    if (currentPage === 0) return <div className="forms-pager-prev" />;
    return (
      <div className="forms-pager-prev" onClick={this.onClickPrev}>
        <Icon name="chevron" />
      </div>
    );
  }

  renderNext() {
    const { totalPages, currentPage } = this.state;

    if (currentPage === totalPages) return <div className="forms-pager-next" />;
    return (
      <div className="forms-pager-next" onClick={this.onClickNext}>
        <Icon name="chevron" />
      </div>
    );
  }

  renderPageNumber() {
    const { totalPages, currentPage } = this.state;

    if (currentPage === totalPages) {
      return (
        <div className="forms-pager-finish" onClick={this.onClickFinish}>
          FINISH
        </div>
      );
    }
    return <div className="forms-pager-number">{`${currentPage + 1} / ${totalPages}`}</div>;
  }

  renderContent() {
    const { schema, formData, customFields } = this.props;
    const { currentPage, totalPages, errors } = this.state;

    if (currentPage === totalPages) {
      return <FormSummary schema={schema} values={formData.formObject} />;
    }
    return (
      <Form
        schema={[schema[currentPage]]}
        currentPage={currentPage}
        onChange={this.onFormChange}
        onFocus={this.onFieldFocus}
        values={formData.formObject[schema[currentPage].name] || {}}
        customFields={customFields}
        errors={errors}
      />
    );
  }

  render() {
    return (
      <div className="forms-pager">
        <div className="form-container">{this.renderContent()}</div>
        <div className="forms-pager-bar">
          {this.renderPrev()}
          {this.renderPageNumber()}
          {this.renderNext()}
        </div>
        <Toast />
      </div>
    );
  }
}

export default FormsEdit;
